/**
 * @Author: santhoshbabu
 * @Date:   06-08-2017 13:44:53
 * @Project: Asset Monitoring
 * @Last modified by:   santhoshbabu
 * @Last modified time: 08-31-2017 11:01:47
 * @Copyright: 2017, Kii Corporation www.kii.com
 */


'use strict';
/** Controller to fetch PowerConsumption information */
angular.module('assetManagementApp').controller('PowerConsumptionCtrl', function($rootScope, $scope, $window, $compile, persistData, dataTable, toastNotifier, logReport, $filter, $translate, $uibModal, $log, $q, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, powerConsumptionFactory, alertNotifier) {
    alertNotifier.clearAlerts();
    var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
    var nextPaginationKey = '';
    var draw;
    var TOKEN = Session.token;
    var vm = this;
    vm.dtInstance = {};
    $scope.powerConsumption = {};

    var powerConsumptionFilterData = {};

    $.fn.dataTable.ext.errMode = 'none';

    $scope.options = CONFIG_DATA.ALERTS.OPTIONS;

    $scope.powerConsumption.filterType = "all";

    $scope.Filter_unFilter = "Filter";

    $scope.resetPowerConsumptionFilter = function() {
      powerConsumptionFactory.setPowerConsumptionFilter('');
      vm.dtInstance.reloadData(null, false);
    };

    $scope.openFilter = function() {

      var modalInstance = $uibModal.open({
        templateUrl: 'filterPrompt.html',
        controller: 'FilterInstanceCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
      modalInstance.result.then(function(selectedItem) {
        $scope.selected = selectedItem;
      }, function() {
        $log.info('PowerConsumption filter modal dismissed at: ' + new Date());
      });

    };

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: (CONFIG_DATA.SERVICES.getPowerConsumptinList.replace('{tenantID}', powerConsumptionFactory.getPowerConsumptionFilter().tenantID || 'all')).replace('{towerID}', powerConsumptionFactory.getPowerConsumptionFilter().towerID || 'all'),
        type: 'GET',
        data: function(d) {
          draw = d.draw;
        },
        headers: {
          "X-Kii-AppID": CONFIG_DATA.APP_ID,
          "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
          "Authorization": "Basic " + Session.token,
          "Content-Type": "application/json",
          "X-XSS-Protection": 1,
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
          "Access-Control-Allow-Origin": "*"
        },
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
            var response = JSON.parse(result);
            var recordsData = {
              draw: draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            };
            console.info(response);
            if(response.status === 200) {

              recordsData['recordsTotal'] = response.data.total;
              recordsData['recordsFiltered'] = response.data.total;
              recordsData['data'] = response.data.powerConsumption;
            } else if(response.status === 403) {
              utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
            } else {

            }
            console.info(recordsData);
            return recordsData;
          }
        },
        error: function(error) {
          logReport.error("Get PowerConsumption Information", JSON.stringify(error));
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
      .withOption('serverSide', true)
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER') + " " + $translate.instant('Menu.ASSETTYPE') + " " + $translate.instant('LABELS.NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.tenant + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.tower + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.dgPower + ' </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.gpPower + '  </p>';
      }),
      // DTColumnBuilder.newColumn(null).
      // renderWith(function(data, type, full, meta) {
      //   return '<p style="color:' + data.class + '"> ' + data.PowerConsumption + ' </p>';
      // }),
      // DTColumnBuilder.newColumn(null)
      // .renderWith(function(data, type, full, meta) {
      //   return '<p>' + $filter('date')(data.created, 'MM-dd-yyyy HH:mm:ss a') + ' </p>';
      // })
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

  })

  .controller('FilterInstanceCtrl', function(GeoCode,$rootScope, $scope, $uibModalInstance, $compile, vm, powerConsumptionFactory, alertNotifier,toastNotifier,logReport,Session,tenantsService,USER_ROLES,$translate,persistData,dashboardService) {

    alertNotifier.clearAlerts();
    $scope.filter = powerConsumptionFactory.getPowerConsumptionFilter();

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
      powerConsumptionFactory.setPowerConsumptionFilter($scope.filter);
      console.log("powerConsumptionFactory###########",JSON.stringify(powerConsumptionFactory.getPowerConsumptionFilter()));
      vm.dtInstance.reloadData(null, false);
      $uibModalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * powerConsumptionFactory used to set and get powerConsumption filter data
   */
  .factory('powerConsumptionFactory', function($window, persistData) {
    var powerConsumptionFilter = {};

    powerConsumptionFilter.setPowerConsumptionFilter = function(filterData) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['powerConsumptionFilter'] = filterData;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };

    powerConsumptionFilter.getPowerConsumptionFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).powerConsumptionFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).powerConsumptionFilter;
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
    console.log("powerConsumptionFactory###########",JSON.stringify(powerConsumptionFilter));
    return powerConsumptionFilter;
  });
