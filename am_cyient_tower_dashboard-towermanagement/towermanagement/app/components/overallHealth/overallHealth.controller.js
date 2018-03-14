/**
 * @Author: santhoshbabu
 * @Date:   06-08-2017 13:44:53
 * @Project: Asset Monitoring
 * @Last modified by:   santhoshbabu
 * @Last modified time: 08-31-2017 11:01:47
 * @Copyright: 2017, Kii Corporation www.kii.com
 */


'use strict';
/** Controller to fetch alert information */

angular.module('assetManagementApp').controller('OverallHealthCtrl',function(overallHealthFactory,$rootScope, $scope,USER_ROLES, $window, $compile, persistData, dataTable, toastNotifier, logReport,GeoCode, $filter,$translate, $uibModal, $log, $q, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, alertNotifier, dashboardService,modelsService,zonesService){
console.log("Hello");
    alertNotifier.clearAlerts();
    var draw = null;

    var vm = this;
    vm.showAssetTnfo = showAssetTnfo;
    vm.dtInstance = {};
    vm.assets = {};
    var geocoder = new $window.google.maps.Geocoder();

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', serverDataSource)
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('createdRow', createdRow)
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn('name'),
      DTColumnBuilder.newColumn('address'),
      DTColumnBuilder.newColumn('location_lat').notSortable(),
      DTColumnBuilder.newColumn('location_lon').notSortable(),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p class="' + data['status-class'] + '"> ' + data.status + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionDeleteHtml)
    ];
    if (Session.tenantType === "Master") {
      vm.dtColumns[5].visible = false;
    } else {
      vm.dtColumns[5].visible = true;
    }

    /**
     * Server call with pagination
     * @param  {JSON} data
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function} promise
     */
    function serverDataSource(data, fnCallback, oSettings) {


                //Service call to server to fetch data
                var overallHealthFilterData = overallHealthFactory.getOverallHealthFilter();

                draw = data.draw;
                data.userToken = Session.token;
                data.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + data.start;
                data.filter = [];
                if (data.order[0].column === 0) {
                  data.order = {
                    dir: data.order[0].dir,
                    column: 'name'
                  };
                } else if (data.order[0].column === 1) {
                  data.order = {
                    dir: data.order[0].dir,
                    column: 'address'
                  };
                } else if (data.order[0].column === 4) {
                  data.order = {
                    dir: data.order[0].dir,
                    column: 'status'
                  };
                }

                if (overallHealthFilterData.status !== 'All') {
                  data.filter.push({
                    key: 'status',
                    value: 'Critical',
                    filterType: 'neq'
                  });
                }

                if (persistData.isValid(overallHealthFilterData.model)) {
                  data.filter.push({
                    key: 'model_id',
                    value: overallHealthFilterData.model,
                    filterType: 'eq'
                  });
                }

                if (persistData.isValid(data.search.value)) {
                  data["search"] = {
                    searchType: "SW",
                    value: data.search.value.toLowerCase()
                  };
                }
                var tenantIdSelected = "";

                if (Session.tenantType !== USER_ROLES.tenant) {
                  if (persistData.isValid(overallHealthFilterData.tenantId)) {
                    tenantIdSelected = overallHealthFilterData.tenantId;
                  } else {
                    tenantIdSelected = 'all';
                  }
                } else {
                  tenantIdSelected = Session.tenantId;
                }


                  //Service call to server to fetch data
                   dashboardService.getAssetsService(tenantIdSelected, data).then(function(result) {
                      var response = getAssets(result);
                      fnCallback(response);

                  }, function(error) {
                      if (error.status === CONFIG_DATA.SERVER_RESPONSE.FAIL_CODE && error.data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN) {
                        utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
                        if (utilityFunctions.isValid($rootScope.modalInstance)) {
                          $rootScope.modalInstance.close();
                        }
                      } else {
                        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                      }
                    });

              }

    /**
     * Fetching data from response and shows in map and list
     * @param  {JSON} result
     * @return {JSON} response
     */
    function getAssets(result) {
      var markersArrayData = [];
      alertNotifier.clearAlerts();
      logReport.info("Info", result);
      var response = {
        draw: draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
      };
      if (persistData.isValid(result.data)) {
        var recordsArrayData = [];
        var data = result.data;
        logReport.info(JSON.stringify(data));
        var responseData = data.status;
        if (responseData === CONFIG_DATA.SERVER_RESPONSE.SUCCESS_CODE) {
          response['recordsTotal'] = data.data.recordsTotal;
          response['recordsFiltered'] = data.data.recordsTotal;
          var assets = data.data.assets;
          if (assets.length === 0) {
            var currentLocation = {
              id: assets.length,

              icon: {
                url: 'images/location-current.png',
                scaledSize: new $window.google.maps.Size(23, 35)
              }
            };
            markersArrayData.push(currentLocation);
            alertNotifier.showAlert($translate.instant('DASHBOARD.SUCCESS.NO_ASSETS'), 'success', null);
          } else {
            angular.forEach(assets, function(record, index) {
              var data = record;
              data['modifiedAt'] = record.modified;
              if (persistData.isValid(record.objectURI)) {
                data['objectURI'] = record.objectURI;
              }
              data['result'] = ((record.hasOwnProperty('result')) ? record.result : null);
              data['id'] = index;


              response.data.push(data);
            });
          }
        } else {
          var message = data.data.message;
          if (responseData.toUpperCase() === CONFIG_DATA.FAIL && message.toUpperCase() === CONFIG_DATA.IN_VALID_TOKEN) {
            utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
            if (utilityFunctions.isValid($rootScope.modalInstance)) {
              $rootScope.modalInstance.close();
            }
          } else if (responseData.toUpperCase() === CONFIG_DATA.FAIL && message.toUpperCase() !== CONFIG_DATA.IN_VALID_TOKEN) {}
        }
      }

      return response;
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionDeleteHtml(data, type, full, meta) {
      vm.assets[data.id] = data;
      return '';
    }

    function actionsHtml(data, type, full, meta) {
      vm.assets[data.id] = data;
      return '<a></a>';
    }
    $scope.onClick = function(marker, eventName, model) {
      var data = model.data;
      if (Session.tenantType === 'Tenant') {
        data.zoneInfo = "block";
      } else {
        data.zoneInfo = "none";
      }
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['assetId'] = data.asset_id;
      sessionInfo['tenantId'] = data.tenat_admin_group_id.split('_')[0];
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);

      model.show = true;
      if (Session.tenantType === 'Tenant') {
        data.zoneInfo = "block";
        if (persistData.isValid(data.zone_id)) {
          var zoneId = data.zone_id;
          zonesService.getZones({
            userToken: Session.token,
            filter: [{
              key: 'c_id',
              value: zoneId,
              filterType: 'eq'
            }]
          }).then(function(result) {
            var customInfo = {
              successMessage: "",
              alreadyExists: "",
              errorMessage: $translate.instant('ZONES.ERROR.RETRIEVE_FAIL')
            };
            var validData = persistData.validifyData(result, customInfo);
            logReport.info("Zone Information", JSON.stringify(result));
            if (Object.keys(validData).length !== 0) {
              data.zoneName = validData.data.records[0]._customInfo.c_name;
            }
          }, function(error) {
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          });
        } else {
          data.zoneName = "Not Assigned";
        }
      } else {
        data.zoneInfo = "none";
      }

    };

    $scope.closeClick = function() {
      $scope.windowOptions.show = false;
    };

    function showAssetTnfo(data) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['assetId'] = data.asset_id;
      sessionInfo['tenantId'] = data.tenat_admin_group_id.split('_')[0];
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    }



  })

  .controller('FilterInstanceCtrl', function(GeoCode,$rootScope, $scope, $uibModalInstance, $compile, vm, overallHealthFactory, alertNotifier,toastNotifier,logReport,Session,tenantsService,USER_ROLES,$translate,persistData,dashboardService) {

    alertNotifier.clearAlerts();
    $scope.filter = overallHealthFactory.getOverallHealthFilter();

    console.info($scope.filter);

    angular.element('#slider').on('slideStop', function(data) {
      updateModel(data.value);
    });

    $scope.updateModel = function(data) {
      $scope.$apply(function() {
        $scope.filter.radius = data.value;
      });
    };

    //Show tenants for master
    if (Session.tenantType === USER_ROLES.master) {
      tenantsService.getTenants({
        userToken: Session.token,
        filter: []
      }).then(function(result) {
        var customInfo = {
          successMessage: "",
          alreadyExists: "",
          errorMessage: $translate.instant('TENANTS.ERROR.RETRIEVE_FAIL')
        };

        logReport.info("Tenants Data", JSON.stringify(result));

        var validData = persistData.validifyData(result, customInfo);
        if (Object.keys(validData).length !== 0) {
          $scope.tenants = validData.data.records;
        }
      }, function(error) {
        logReport.error("Import Models From Master", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }
    if (Session.tenantType === USER_ROLES.master) {
      dashboardService.getAssetsService( 'all', {
        userToken: Session.token,
        start: 0,
        length: 100,
        filter: []
      }).then(function(result) {


        logReport.info("Towers Data", JSON.stringify(result));
        if(result.data.status === 200) {

          $scope.towers = result.data.data.assets;
        } else if(result.data.status === 403) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
        }

      }, function(error) {
        logReport.error("Import Models From Master", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }


    $scope.filterData = function() {
      if(persistData.isValid($scope.filter.address)){
      GeoCode.latLong($scope.filter.address)
        .then(function(results) {
          if (results[0]) {
          var latLong = {
              latValue: results[0].geometry.location.lat(),
              lonValue: results[0].geometry.location.lng()
            };

  logReport.info(JSON.stringify(latLong));





          } else {
            alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
          }
        }, function(error) {
          alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
        });
        }
      overallHealthFactory.setOverallHealthFilter($scope.filter);
      console.log("overallHealthFactory###########",JSON.stringify(overallHealthFactory.getOverallHealthFilter()));
      vm.dtInstance.reloadData(null, false);
      $uibModalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * overallHealthFactory used to set and get overallHealth filter data
   */
  .factory('overallHealthFactory', function($window, persistData) {
    var overallHealthFilter = {};

    overallHealthFilter.setOverallHealthFilter = function(filterData) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['overallHealthFilter'] = filterData;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };

    overallHealthFilter.getOverallHealthFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).overallHealthFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).overallHealthFilter;
      } else {
        return {
          tenantID: '',
          towerID: '',
          fromDate: '',
          toDate: '',
          address: '',
          radius: 20
        };
      }
    };
    console.log("overallHealthFactory###########",JSON.stringify(overallHealthFilter));
    return overallHealthFilter;
  });
