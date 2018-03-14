/**
 * @Date:   01-27-2017 12:01:08
 * @Project: AssetMonitoring
 * @Last modified time: 08-18-2017 15:14:45
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to shows users and vending machines assigned to zone
 */
angular.module('assetManagementApp').controller('ZoneInfoCtrl', function($scope, CONFIG_DATA, $translate) {
    $scope.tabs = [{
        "faName": "users",
        heading: $translate.instant('LABELS.USERS'),
        content: "zone-users",
        isLoaded: false
      },
      {
        "faName": "building",
        heading: $translate.instant('Menu.ASSETTYPES'),
        content: "zone-assets",
        isLoaded: false
      }
    ];

    $scope.setTabContent = function(name) {
      $scope.tabContentUrl = "components/zone-info/" + name + ".html";
    };
  })

  /**
   * Controller to show assigned users to zone
   */
  .controller('AssignedUsersToZoneCtrl', function($rootScope, $scope, $window, $compile, toastNotifier, $filter, $translate, $timeout, Session, DTOptionsBuilder, $uibModal, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, usersService, persistData, dataTable, logReport, alertNotifier, zonesService, zoneInfoService) {
    alertNotifier.clearAlerts();
    var draw = null;
    var assignedInputUsersList = [];
    var zoneId = JSON.parse($window.sessionStorage["sessionInfo"]).zoneId;
    var assignedUsers = this;
    assignedUsers.dtInstance = {};
    assignedUsers.users = {};
    assignedUsers.unassignUserFromZone = unassignUserFromZone;

    $.fn.dataTable.ext.errMode = 'none';

    assignedUsers.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', assignedUsersServerDataSource)
      .withDataProp(function(result) {
        return result.data;
      }).withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', {
        details: {
          renderer: function(api, rowIndex) {
            var data = dataTable.rendererRows(api, rowIndex);
            // gets the table and append the rows
            var table = angular
              .element('<table/>')
              .append(data);

            // compile the table to keep the events
            $compile(table.contents())($scope);

            return table;
          }
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: 'Enter Username'
      })
      .withOption('serverSide', true);

    assignedUsers.dtColumns = [
      DTColumnBuilder.newColumn('userMail'),
      DTColumnBuilder.newColumn('userName'),
      DTColumnBuilder.newColumn('userRole'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    /**
     * Function to get assigned users from server
     * @param  {JSON} d
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function}
     */
    function assignedUsersServerDataSource(d, fnCallback, oSettings) {
      zonesService.getZones({
        userToken: Session.token,
        filter: [{
          key: 'c_id',
          value: zoneId,
          filterType: 'eq'
        }]
      }).then(function(result) {
        var customInfo = {
          successMessage: '',
          alreadyExists: '',
          errorMessage: ''
        };

        var validData = persistData.validifyData(result, customInfo);

        logReport.info("Get Zone Information", JSON.stringify(validData));

        if (Object.keys(validData).length !== 0) {
          var zone = validData.data.records[0]._customInfo;
          $rootScope.zoneDisplayName = zone.c_name;
          var technicians = (persistData.isValid(zone.technician_users)) ? ((zone.technician_users.length > 0) ? zone.technician_users : ['']) : [''];
          var observers = (persistData.isValid(zone.observer_users)) ? ((zone.observer_users.length > 0) ? zone.observer_users : ['']) : [''];

          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [{
            key: 'userRole',
            value: 'Admin',
            filterType: 'neq'
          }, {
            key: 'userRole',
            value: 'User',
            filterType: 'neq'
          }, {
            key: 'userId',
            value: technicians.concat(observers),
            filterType: 'incl'
          }];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userMail'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userName'
            };
          } else if (d.order[0].column === 2) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userRole'
            };
          } else if (d.order[0].column === 3) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userTechnicalLevel'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.users.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.users.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Assigned Users Query", JSON.stringify(d));

          //Service call to get assigned users to zone
          usersService.getUsers(d).then(function(result) {
            var response = dataTable.filterData(JSON.stringify(result.data), draw);
            fnCallback(response);
          });
        }
      }, function(error) {
        logReport.error("Get Zone Information", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      assignedUsers.users[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Unassign" ng-click="assignedUsers.unassignUserFromZone(assignedUsers.users[' + data.id + '])" )"="">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    /**
     * Function to unassign user from zone
     * @param  {JSON} userInfo
     */
    function unassignUserFromZone(userInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'unassignUserFromZonePrompt.html',
        controller: 'UnassignUserFromZoneCtrl',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          userInfo: function() {
            return userInfo;
          },
          assignedUsers: function() {
            return assignedUsers;
          },
          zoneId: function() {
            return zoneId;
          }
        }
      });
    }

    $scope.assignUserPopup = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'assignUsersPrompt.html',
        controller: 'ShowUsersToAssignZoneCtrl as showUsersToAssignZone',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assignedUsers: function() {
            return assignedUsers;
          },
          zoneId: function() {
            return zoneId;
          }
        }
      });
    };
  })

  /**
   * Controller to unassign user from zone
   */
  .controller('UnassignUserFromZoneCtrl', function($scope, $rootScope, $log, $compile, $window, $http, $translate, $state, $uibModalInstance, Session, CONFIG_DATA, persistData, logReport, toastNotifier, alertNotifier, zoneInfoService, userInfo, assignedUsers, zoneId) {
    alertNotifier.clearAlerts();
    $scope.unassignUserMail = userInfo.userMail;
    $scope.unassignUserName = userInfo.userName;

    $scope.unassignUser = function() {
      var data = {
        userToken: Session.token,
        userIdToUnassign: userInfo.userId,
        zoneId: zoneId
      };

      logReport.info("Unassign User From Zone", JSON.stringify(data));

      zoneInfoService.unAssignUserFromZone(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ZONE_INFO.USERS.SUCCESS.UNASSIGN_SUCCESS'),
            alreadyExists: '',
            errorMessage: $translate.instant('ZONE_INFO.USERS.ERROR.UNASSIGN_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            assignedUsers.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Unassign User From Zone", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to show unassigned users for assigning to zone
   */
  .controller('ShowUsersToAssignZoneCtrl', function($rootScope, $scope, $window, $timeout, $uibModalInstance, $translate, $compile, $q, Session, CONFIG_DATA, zonesService, zoneInfoService, AUTH_EVENTS, USER_ROLES, DTOptionsBuilder, DTColumnBuilder, usersService, assignedUsers, persistData, dataTable, toastNotifier, alertNotifier, logReport, eachSeries, zoneId) {
    alertNotifier.clearAlerts();
    var draw = null;
    var unassignedUsers = this;
    unassignedUsers.selected = {};
    unassignedUsers.selectAll = false;
    unassignedUsers.toggleAll = toggleAll;
    unassignedUsers.toggleOne = toggleOne;
    unassignedUsers.dtInstance = {};
    unassignedUsers.users = {};
    $scope.userFilterType = "firstName";
    $scope.selectedData = [];

    var titleHtml = '<label class="checkbox-inline checkbox-custom-alt"><input type="checkbox" ng-model="showUsersToAssignZone.selectAll" ng-click="showUsersToAssignZone.toggleAll(showUsersToAssignZone.selectAll, showUsersToAssignZone.selected)"><i></i></label>';

    $.fn.dataTable.ext.errMode = 'none';

    unassignedUsers.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', unassignedUsersServerDataSource)
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', true)
      .withOption('createdRow', createdRow)
      .withOption('headerCallback', function(header) {
        if (!unassignedUsers.headerCompiled) {
          // Use this headerCompiled field to only compile header once
          unassignedUsers.headerCompiled = true;
          $compile(angular.element(header).contents())($scope);
        }
      })
      .withOption('language', {
        searchPlaceholder: 'Enter Username'
      })
      .withOption('serverSide', true);

    unassignedUsers.dtColumns = [
      DTColumnBuilder.newColumn('userMail'),
      DTColumnBuilder.newColumn('userName'),
      DTColumnBuilder.newColumn('userRole'),
      DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
      .renderWith(function(data, type, full, meta) {
        unassignedUsers.selected[full.id] = false;
        unassignedUsers.users[data.id] = data;
        var index = $scope.selectedData.indexOf(data.userId);
        if (index > -1) {
          unassignedUsers.selected[data.id] = true;
        }
        return '<label class="checkbox-inline checkbox-custom-alt"><input type="checkbox" ng-model="showUsersToAssignZone.selected[' + data.id + ']" ng-click="showUsersToAssignZone.toggleOne(showUsersToAssignZone.selected)"><i></i></label>';
      })
    ];

    /**
     * Function to get unassigned users from server
     * @param  {JSON} d
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function} promise
     */
    function unassignedUsersServerDataSource(d, fnCallback, oSettings) {
      console.error(JSON.stringify({
        userToken: Session.token,
        filter: [{
          key: 'c_id',
          value: zoneId,
          filterType: 'eq'
        }]
      }));
      zonesService.getZones({
        userToken: Session.token,
        filter: [{
          key: 'c_id',
          value: zoneId,
          filterType: 'eq'
        }]
      }).then(function(result) {
        var customInfo = {
          successMessage: '',
          alreadyExists: '',
          errorMessage: ''
        };

        var validData = persistData.validifyData(result, customInfo);

        logReport.info("Get Zone Information", JSON.stringify(validData));

        if (Object.keys(validData).length !== 0) {
          var zone = validData.data.records[0]._customInfo;
          $rootScope.zoneDisplayName = zone.c_name;
          var technicians = (persistData.isValid(zone.technician_users)) ? ((zone.technician_users.length > 0) ? zone.technician_users : ['']) : [''];
          var observers = (persistData.isValid(zone.observer_users)) ? ((zone.observer_users.length > 0) ? zone.observer_users : ['']) : [''];

          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;

          d.filter = [{
            key: 'userRole',
            value: 'Admin',
            filterType: 'neq'
          }, {
            key: 'userRole',
            value: 'User',
            filterType: 'neq'
          }, {
            key: 'userId',
            value: technicians.concat(observers),
            filterType: 'notincl'
          }];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userMail'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userName'
            };
          } else if (d.order[0].column === 2) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userRole'
            };
          }

          if (persistData.isValid($scope.userFilterValue)) {
            d.filter.push({
              key: $scope.userFilterType,
              value: $scope.userFilterValue,
              filterType: 'sw'
            });
          }

          if (persistData.isValid(d.search.value)) {
            d.filter.push({
              key: CONFIG_DATA.SEARCH.users.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.users.filterType
            });
          }

          logReport.info("Get Unassigned Users Query", JSON.stringify(d));

          //Service to get unassigned users
          usersService.getUsers(d).then(function(result) {
            var response = dataTable.filterData(JSON.stringify(result.data), draw);
            unassignedUsers.selected = [];
            unassignedUsers.selectAll = (response.data.length > 0);
            angular.forEach(response.data, function(data, key) {
              var index = $scope.selectedData.indexOf(data.userId);
              if (index < 0) {
                unassignedUsers.selectAll = false;
              }
            });
            fnCallback(response);
          });
        }
      }, function(error) {
        logReport.error("Get Zone Information", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }

    function toggleAll(selectAll, selectedItems) {
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          selectedItems[id] = selectAll;
        }
      }

      var data = unassignedUsers.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(unassignedUsers.users[key].userId);
          if (index < 0) {
            $scope.selectedData.push(unassignedUsers.users[key].userId);
          }
        } else {
          var index = $scope.selectedData.indexOf(unassignedUsers.users[key].userId);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
    }

    function toggleOne(selectedItems) {
      var data = unassignedUsers.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(unassignedUsers.users[key].userId);
          if (index < 0) {
            $scope.selectedData.push(unassignedUsers.users[key].userId);
          }
        } else {
          var index = $scope.selectedData.indexOf(unassignedUsers.users[key].userId);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          if (!selectedItems[id]) {
            unassignedUsers.selectAll = false;
            return;
          }
        }
      }
      unassignedUsers.selectAll = true;
    }

    //Assign user(s) to zone
    $scope.assignUserToZone = function() {
      var data = unassignedUsers.selected;
      var details = [];
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          details.push(unassignedUsers.users[key]);
        }
      });

      var totalCount = 0;
      var successCount = 0;
      var failCount = 0;
      var assignUsersData = [];

      angular.forEach($scope.selectedData, function(value, key) {
        var data = {
          userToken: Session.token,
          userIdToAssign: $scope.selectedData[key],
          zoneId: zoneId
        };
        logReport.info("Assign Users Information", JSON.stringify(data));
        assignUsersData.push(data);
      });

      // angular.forEach(details, function(value, key) {
      //   var data = {
      //     userToken: Session.token,
      //     userIdToAssign: details[key].userId,
      //     zoneId: zoneId
      //   };
      //   logReport.info("Assign Users Information", JSON.stringify(data));
      //   assignUsersData.push(data);
      // });

      /**
       * Assigning multiple user(s) in a sequential order
       * @param  {JSON} data
       */
      eachSeries(assignUsersData, function(data) {
        return zoneInfoService.assignUserToZone(data).then(function(result) {

            logReport.info("Assigen Users Information Response", JSON.stringify(result));

            var customInfo = {
              successMessage: '',
              alreadyExists: '',
              errorMessage: ''
            };

            var validData = persistData.validifyData(result, customInfo);

            if (Object.keys(validData).length !== 0) {
              successCount++;
            } else {
              failCount++;
            }
            totalCount++;
          },
          function(error) {
            logReport.error("Assign User(s) To Zone", JSON.stringify(error));
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          }
        );
      }).then(function() {
        // All done
        if (totalCount === failCount) {
          toastNotifier.showError($translate.instant('ZONE_INFO.USERS.ERROR.ASSIGN_FAIL'));
        } else {
          toastNotifier.showSuccess(successCount + ' out of ' + totalCount + ' ' + $translate.instant('ZONE_INFO.USERS.SUCCESS.ASSIGN_SUCCESS'));
        }
        assignedUsers.dtInstance.reloadData(null, false);
        $rootScope.modalInstance.close();
      });
    };

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * Controller to show assigned machines to zone
   */
  .controller('AssignedAssetsToZoneCtrl', function($rootScope, $scope, $window, $compile, $filter, $translate, $timeout, dashboardService, zonesService, toastNotifier, alertNotifier, zoneInfoService, Session, DTOptionsBuilder, $uibModal, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, persistData, dataTable, logReport) {
    alertNotifier.clearAlerts();
    var draw = null;
    var zoneId = JSON.parse($window.sessionStorage["sessionInfo"]).zoneId;
    var assignedAssets = this;
    assignedAssets.dtInstance = {};
    assignedAssets.assets = {};
    assignedAssets.unassignAssetFromZone = unassignAssetFromZone;

    $.fn.dataTable.ext.errMode = 'none';

    assignedAssets.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', assignedAssetServerDataSource)
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('language', {
        searchPlaceholder: 'Enter Name'
      })
      .withOption('createdRow', createdRow)
      .withOption('serverSide', true);

    assignedAssets.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn('c_address'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    /**
     * Function to get assigned machines from server
     * @param  {JSON} d
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function} promise
     */
    function assignedAssetServerDataSource(d, fnCallback, oSettings) {
      zonesService.getZones({
        userToken: Session.token,
        filter: [{
          key: 'c_id',
          value: zoneId,
          filterType: 'eq'
        }]
      }).then(function(result) {
        var customInfo = {
          successMessage: '',
          alreadyExists: '',
          errorMessage: ''
        };

        var validData = persistData.validifyData(result, customInfo);

        logReport.info("Get Zone Information in assignedAssets", JSON.stringify(validData));

        if (Object.keys(validData).length !== 0) {
          var zone = validData.data.records[0]._customInfo;
          $rootScope.zoneDisplayName = zone.c_name;
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [{
            key: 'c_assetId',
            value: (persistData.isValid(zone.assets)) ? ((zone.assets.length > 0) ? zone.assets : ['']) : [''],
            filterType: 'incl'
          }, {
            key: 'isZoneAssigned',
            value: true,
            filterType: 'eq'
          }];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_address'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.dashboard.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.dashboard.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Assigned assets Query", JSON.stringify(d));

          //Service call to get assigned assets
          dashboardService.getAssets(d).then(function(result) {
            var response = dataTable.filterData(JSON.stringify(result.data), draw);
            fnCallback(response);
          });
        }
      }, function(error) {
        logReport.error("Get Zone Information", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      assignedAssets.assets[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Unassign" ng-click="assignedAssets.unassignAssetFromZone(assignedAssets.assets[' + data.id + '])" )"="">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    /**
     * Function to unassign machine from zone
     * @param  {JSON} assetInfo
     */
    function unassignAssetFromZone(assetInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'unassignAssetFromZonePrompt.html',
        controller: 'UnassignAssetFromZoneCtrl',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assetInfo: function() {
            return assetInfo;
          },
          assignedAssets: function() {
            return assignedAssets;
          },
          zoneId: function() {
            return zoneId;
          }
        }
      });
    }

    $scope.assignAssetPopup = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'assignAssetPrompt.html',
        controller: 'ShowAssetsToAssignZoneCtrl as unassignedAssets',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assignedAssets: function() {
            return assignedAssets;
          },
          zoneId: function() {
            return zoneId;
          }
        }
      });
    };
  })

  /**
   * Controller to unassign machine from zone
   */
  .controller('UnassignAssetFromZoneCtrl', function($scope, $rootScope, $window, $log, $http, $translate, $state, $uibModalInstance, Session, CONFIG_DATA, AUTH_EVENTS, persistData, logReport, toastNotifier, alertNotifier, zoneInfoService, assetInfo, assignedAssets, zoneId) {
    alertNotifier.clearAlerts();
    $scope.unassignAssetName = assetInfo.c_name;

    $scope.unassignMachine = function() {
      var data = {
        userToken: Session.token,
        assetIdToUnAssign: assetInfo.c_assetId,
        zoneId: zoneId
      };

      logReport.info("Unassign Asset From Zone", JSON.stringify(data));

      zoneInfoService.unAssignAssetFromZone(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ZONE_INFO.ASSETS.SUCCESS.UNASSIGN_SUCCESS'),
            alreadyExists: '',
            errorMessage: $translate.instant('ZONE_INFO.ASSETS.ERROR.UNASSIGN_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            assignedAssets.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Unassign Asset From Zone", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to get unassigned machines for assigning to zone
   */
  .controller('ShowAssetsToAssignZoneCtrl', function($rootScope, $scope, $window, $timeout, toastNotifier, alertNotifier, $uibModalInstance, $translate, $compile, $q, Session, CONFIG_DATA, dashboardService, zonesService, zoneInfoService, AUTH_EVENTS, DTOptionsBuilder, DTColumnBuilder, assignedAssets, persistData, dataTable, logReport, eachSeries, zoneId) {
    alertNotifier.clearAlerts();
    var draw = null;
    var unassignedAssets = this;
    unassignedAssets.selected = {};
    unassignedAssets.selectAll = false;
    unassignedAssets.toggleAll = toggleAll;
    unassignedAssets.toggleOne = toggleOne;
    unassignedAssets.dtInstance = {};
    unassignedAssets.assets = {};
    $scope.assetFilterType = "c_name";
    $scope.selectedData = [];
    var titleHtml = '<label class="checkbox-inline checkbox-custom-alt"><input type="checkbox" ng-model="unassignedAssets.selectAll" ng-click="unassignedAssets.toggleAll(unassignedAssets.selectAll, unassignedAssets.selected)"><i></i></label>';

    $.fn.dataTable.ext.errMode = 'none';

    unassignedAssets.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', unassignedAssetServerDataSource)
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('language', {
        searchPlaceholder: 'Enter Name'
      })
      .withOption('headerCallback', function(header) {
        if (!unassignedAssets.headerCompiled) {
          // Use this headerCompiled field to only compile header once
          unassignedAssets.headerCompiled = true;
          $compile(angular.element(header).contents())($scope);
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('serverSide', true);

    unassignedAssets.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn('c_address'),
      DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
      .renderWith(function(data, type, full, meta) {
        unassignedAssets.selected[full.id] = false;
        unassignedAssets.assets[data.id] = data;
        var index = $scope.selectedData.indexOf(data.c_assetId);
        if (index > -1) {
          unassignedAssets.selected[data.id] = true;
        }
        return '<label class="checkbox-inline checkbox-custom-alt"><input type="checkbox" ng-model="unassignedAssets.selected[' + data.id + ']" ng-click="unassignedAssets.toggleOne(unassignedAssets.selected)"><i></i></label>';
      }),
    ];

    /**
     * Function to get unassigned machines from server
     * @param  {JSON} d
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function} promise
     */
    function unassignedAssetServerDataSource(d, fnCallback, oSettings) {
      zonesService.getZones({
        userToken: Session.token,
        filter: [{
          key: 'c_id',
          value: zoneId,
          filterType: 'eq'
        }]
      }).then(function(result) {
        var customInfo = {
          successMessage: '',
          alreadyExists: '',
          errorMessage: ''
        };

        var validData = persistData.validifyData(result, customInfo);

        logReport.info("Get Zone Information", JSON.stringify(validData));

        if (Object.keys(validData).length !== 0) {
          var zone = validData.data.records[0]._customInfo;
          $rootScope.zoneDisplayName = zone.c_name;
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [{
            key: 'c_assetId',
            value: (persistData.isValid(zone.assets)) ? ((zone.assets.length > 0) ? zone.assets : ['']) : [''],
            filterType: 'notincl'
          }, {
            key: 'isZoneAssigned',
            value: true,
            filterType: 'neq'
          }];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_address'
            };
          }

          if (persistData.isValid($scope.assetFilterValue)) {
            d.filter.push({
              key: $scope.assetFilterType,
              value: $scope.assetFilterValue,
              filterType: 'sw'
            });
          }

          if (persistData.isValid(d.search.value)) {
            d.filter.push({
              key: CONFIG_DATA.SEARCH.dashboard.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.dashboard.filterType
            });
          }

          logReport.info("Get Unassigned Assets Information", JSON.stringify(d));

          //Service call to get unassigned machines
          dashboardService.getAssets(d).then(function(result) {
            var response = dataTable.filterData(JSON.stringify(result.data), draw);
            unassignedAssets.selected = [];
            unassignedAssets.selectAll = (response.data.length > 0);
            angular.forEach(response.data, function(data, key) {
              var index = $scope.selectedData.indexOf(data.c_assetId);
              if (index < 0) {
                unassignedAssets.selectAll = false;
              }
            });
            fnCallback(response);
          });
        }
      }, function(error) {
        logReport.error("Get Zone Information", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }

    function toggleAll(selectAll, selectedItems) {
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          selectedItems[id] = selectAll;
        }
        
      }
      var data = unassignedAssets.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(unassignedAssets.assets[key].c_assetId);
          if (index < 0) {
            $scope.selectedData.push(unassignedAssets.assets[key].c_assetId);
          }
        } else {
          var index = $scope.selectedData.indexOf(unassignedAssets.assets[key].c_assetId);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
    }

    function toggleOne(selectedItems) {
      // console.log(JSON.stringify(selectedItems));
      var data = unassignedAssets.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(unassignedAssets.assets[key].c_assetId);
          if (index < 0) {
            $scope.selectedData.push(unassignedAssets.assets[key].c_assetId);
          }
        } else {
          var index = $scope.selectedData.indexOf(unassignedAssets.assets[key].c_assetId);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          if (!selectedItems[id]) {
            unassignedAssets.selectAll = false;
            return;
          }
        }
      }
      unassignedAssets.selectAll = true;
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    // Assign machine(s) to zone
    $scope.assignAssetsToZone = function() {
      var data = unassignedAssets.selected;
      var details = [];
      logReport.info("Assign Assets Information", JSON.stringify(data));
      // angular.forEach(data, function(value, key) {
      //   if (data[key] === true) {
      //     details.push({
      //       c_assetId: unassignedAssets.assets[key].c_assetId
      //     });
      //   }
      // });

      angular.forEach($scope.selectedData, function(c_assetId, key) {
        details.push({
          c_assetId: c_assetId
        });
      });

      var successCount = 0;
      var failCount = 0;
      var totalCount = 0;
      var assignAssetsData = [];
      angular.forEach(details, function(value, key) {
        var data = {
          userToken: Session.token,
          assetIdToAssign: details[key].c_assetId,
          zoneId: zoneId
        };
        logReport.info("Assign Assets Information", JSON.stringify(data));
        assignAssetsData.push(data);
      });

      /**
       * Function for assigning multiple assets(s) to zone in a sequential order
       * @param  {JSON} data
       */
      eachSeries(assignAssetsData, function(data) {
        return zoneInfoService.assignAssetToZone(data).then(function(result) {
            logReport.info("Assign Asset Information Response", JSON.stringify(result));
            var customInfo = {
              successMessage: '',
              alreadyExists: '',
              errorMessage: ''
            };

            var validData = persistData.validifyData(result, customInfo);

            if (Object.keys(validData).length !== 0) {
              successCount++;
            } else {
              failCount++;
            }
            totalCount++;
          },
          function(error) {
            logReport.error("Assign Asset(s) To Zone", JSON.stringify(error));
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          }
        );
      }).then(function() {
        // All done
        if (totalCount === failCount) {
          toastNotifier.showError($translate.instant('ZONE_INFO.ASSETS.ERROR.ASSIGN_FAIL'));
        } else {
          toastNotifier.showSuccess(successCount + ' out of ' + totalCount + ' ' + $translate.instant('ZONE_INFO.ASSETS.SUCCESS.ASSIGN_SUCCESS'));
        }
        assignedAssets.dtInstance.reloadData(null, false);
        $rootScope.modalInstance.close();
      });
    };
  });
