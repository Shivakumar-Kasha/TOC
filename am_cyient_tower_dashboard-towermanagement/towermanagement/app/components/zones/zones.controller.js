/**
 * @Date:   01-27-2017 12:01:52
 * @Project: AssetMonitoring
 * @Last modified time: 07-06-2017 17:52:58
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch zones information
 */
angular.module('assetManagementApp').controller('ZonesCtrl', function($rootScope, $scope, $window, $uibModal, $compile, $sanitize, Session, CONFIG_DATA, toastNotifier, alertNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, logReport) {
    alertNotifier.clearAlerts();
    var draw = null;
    var vm = this;
    vm.dtInstance = {};
    vm.zones = {};
    vm.delete = deleteZone;
    vm.edit = editZone;
    $.fn.dataTable.ext.errMode = 'none';
    $scope.onClick = function(id) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['zoneId'] = vm.zones[id].c_id;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };
    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONES.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.zones.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.zones.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Zones Query", JSON.stringify(d));

          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            var zonesArray = response.data;
            if (zonesArray.length !== 0) {
              var zonesKeys = Object
                .keys(zonesArray);
              response.data = [];
              for (var i = 0; i < zonesKeys.length; i++) {
                var zone = zonesArray[i];

                var assetsCount = zone.assets;
                if (persistData.isValid(assetsCount)) {
                  zone['assetsCount'] = assetsCount.length;
                } else {
                  zone['assetsCount'] = 0;
                }

                var techniciansCount = zone.technician_users;
                if (persistData.isValid(techniciansCount)) {
                  zone['techniciansCount'] = techniciansCount.length;
                } else {
                  zone['techniciansCount'] = 0;
                }

                var observersCount = zone.observer_users;
                if (persistData.isValid(observersCount)) {
                  zone['observersCount'] = observersCount.length;
                } else {
                  zone['observersCount'] = 0;
                }
                var technicians = (persistData.isValid(zone.technician_users)) ? ((zone.technician_users.length > 0) ? zone.technician_users : ['']) : [''];
                var observers = (persistData.isValid(zone.observer_users)) ? ((zone.observer_users.length > 0) ? zone.observer_users : ['']) : [''];
                zone['assets'] = (persistData.isValid(zone.assets)) ? ((zone.assets.length > 0) ? zone.assets : ['']) : [''];

                response.data.push(zone);
              }
            }

            logReport.info("Get Zones Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Zones Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      })
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
      .withOption('language', {
        searchPlaceholder: 'Enter Name'
      })
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
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn(null).renderWith(zoneInfoHtml),
      DTColumnBuilder.newColumn('assetsCount').notSortable(),
      DTColumnBuilder.newColumn('techniciansCount').notSortable(),
      DTColumnBuilder.newColumn('observersCount').notSortable(),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function zoneInfoHtml(data, type, full, meta) {
      vm.zones[data.id] = data;
      return '<a ui-sref="app.zone-info" ng-click="onClick(' + data.id + ')"> ' + data.c_name + ' </a>';
    }

    function actionsHtml(data, type, full, meta) {
      vm.zones[data.id] = data;
      return '<div class="text-center"><button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="zonesInfo.edit(zonesInfo.zones[' + data.id + '])" )"="">' +
        '<i class="fa fa-edit"></i>' +
        '</button>' +
        '&nbsp;<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="zonesInfo.delete(zonesInfo.zones[' + data.id + '])" )"="">' +
        '<i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    /**
     * function to add zone information
     * @param  {JSON} zoneInfo
     */
    $scope.addZone = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addZonePrompt.html',
        controller: 'AddZoneCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
    };

    /**
     * function to edit zone information
     * @param  {JSON} zoneInfo
     */
    function editZone(zoneInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addZonePrompt.html',
        controller: 'EditZoneCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          zoneInfo: function() {
            return zoneInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

    /**
     * function to delete zone
     * @param  {JSON} zoneInfo
     */
    function deleteZone(zoneInfo) {
      if(zoneInfo.assetsCount > 0){
         toastNotifier.showWarning($translate.instant('Menu.ASSETTYPES') + " " + $translate.instant('INFO.UNASSIGN_ASSET_FROM_ZONE'));
         return false;
      }
      
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteZonePrompt.html',
        controller: 'DeleteZoneCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          zoneInfo: function() {
            return zoneInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    
  }
  })

  /**
   * Controller to add zone information
   */
  .controller('AddZoneCtrl', function($scope, $sanitize, $translate, Session, zonesService, persistData, logReport, toastNotifier, vm, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.Add_or_Update_Zone = $translate.instant('CRUD.ADD');
    $scope.Add_or_Update = $translate.instant('BUTTONS.CREATE');

    /* Add zone function*/

    $scope.submit = function() {
      var data = {
        userToken: Session.token,
        zoneData: {
          c_name: $scope.zoneName
        }
      };
      logReport.info("Add Zone Information: ", JSON.stringify(data));
      zonesService.addZone(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ZONES.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('ZONES.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('ZONES.ERROR.ADD_ZONE_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Add Zone Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to edit and update zone information
   */
  .controller('EditZoneCtrl', function($rootScope, $scope, $translate, Session, zonesService, persistData, logReport, toastNotifier, alertNotifier, zoneInfo, vm) {
    alertNotifier.clearAlerts();
    $scope.Add_or_Update_Zone = 'Edit';
    $scope.Add_or_Update = $translate.instant('CRUD.UPDATE');
    $scope.zoneName = zoneInfo.c_name;
    logReport.info("Edit Information", JSON.stringify(zoneInfo));

    /* Edit zone function*/

    $scope.submit = function() {
      var data = {
        userToken: Session.token,
        zoneData: {
          c_name: $scope.zoneName
        },
        c_id: zoneInfo.c_id
      };

      logReport.info("Edit Zone Information", JSON.stringify(data));

      zonesService.updateZone(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ZONES.SUCCESS.UPDATION_SUCCESS'),
            alreadyExists: $translate.instant('ZONES.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('ZONES.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Edit Zone Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        });
    };
  })

  /**
   * Controller to delete zone Information
   */
  .controller('DeleteZoneCtrl', function($rootScope, $scope, $translate, Session, CONFIG_DATA, DTOptionsBuilder, DTColumnBuilder, zonesService, persistData, logReport, toastNotifier, alertNotifier, zoneInfo, vm) {
    alertNotifier.clearAlerts();
    $scope.deleteZoneName = zoneInfo.c_name;
    logReport.info("ZoneInfo:" +JSON.stringify(zoneInfo))
    var deleteData = {
      userToken: Session.token,
      c_id: zoneInfo.c_id
    };

    logReport.info("Delete Zone Information", JSON.stringify(deleteData));
    /* Delete zone function*/
    $scope.deleteZone = function() {
      zonesService.deleteZone(deleteData).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ZONES.SUCCESS.DELETION_SUCCESS'),
            alreadyExists: '',
            errorMessage: $translate.instant('ZONES.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Delete Zone Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  });
