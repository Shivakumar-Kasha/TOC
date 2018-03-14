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
angular.module('assetManagementApp').controller('AlertsCtrl', function($rootScope, $scope, $compile, persistData, dataTable, toastNotifier, logReport, $filter, $translate, $uibModal, $log, $q, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, alertsFactory, alertNotifier) {
    alertNotifier.clearAlerts();
    var nextPaginationKey = '';
    var draw;
    var TOKEN = Session.token;
    var vm = this;
    vm.dtInstance = {};
    $scope.alerts = {};

    $.fn.dataTable.ext.errMode = 'none';

    $scope.options = CONFIG_DATA.ALERTS.OPTIONS;

    $scope.alerts.filterType = "all";

    $scope.Filter_unFilter = "Filter";

    $scope.resetAlertFilter = function() {
      alertsFactory.setAlertsFilter('');
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
        $log.info('Alerts filter modal dismissed at: ' + new Date());
      });

    };

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.ALERTS.getMethod,
        type: 'POST',
        data: function(data) {
          var alertsFilterData = alertsFactory.getAlertsFilter();
          draw = data.draw;
          data.userToken = TOKEN;
          data.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + data.start;
          data.filter = [];
          if (data.order[0].column === 0) {
            data.order = {
              dir: data.order[0].dir,
              column: 'c_name'
            };
          } else if (data.order[0].column === 1) {
            data.order = {
              dir: data.order[0].dir,
              column: 'address'
            };
          } else if (data.order[0].column === 2) {
            data.order = {
              dir: data.order[0].dir,
              column: 'sensorName'
            };
          } else if (data.order[0].column === 3) {
            data.order = {
              dir: data.order[0].dir,
              column: 'reading'
            };
          } else if (data.order[0].column === 4) {
            data.order = {
              dir: data.order[0].dir,
              column: 'alert'
            };
          } else if (data.order[0].column === 5) {
            data.order = {
              dir: data.order[0].dir,
              column: '_created'
            };
          }

          if (persistData.isValid(alertsFilterData.assetLocation)) {
            data.filter.push({
              key: 'address',
              value: alertsFilterData.assetLocation,
              filterType: 'eq'
            });
          }

          if (persistData.isValid(alertsFilterData.sensorType)) {
            data.filter.push({
              key: 'sensorName',
              value: alertsFilterData.sensorType,
              filterType: 'eq'
            });
          }

          if (persistData.isValid(alertsFilterData.assetName)) {
            data.filter.push({
              key: 'assetName',
              value: alertsFilterData.assetName,
              filterType: 'eq'
            });
          }

          if (persistData.isValid(alertsFilterData.assetAlert)) {
            data.filter.push({
              key: 'alert',
              value: alertsFilterData.assetAlert,
              filterType: 'eq'
            });
          }

          if (persistData.isValid(data.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.alerts.searchBy,
              value: data.search.value,
              filterType: CONFIG_DATA.SEARCH.alerts.filterType
            };
            data.filter.push(search);
          }

          $log.info("Get alerts data: " + JSON.stringify(data));
          return JSON.stringify(data);
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
            logReport.info("Get Alerts Information", JSON.stringify(response));
            var alertslist = response.data;
            if (alertslist.length !== 0) {
              response.data = [];
              angular.forEach(alertslist, function(alert) {
                var units = "";
                if (alert.units === 'F' || alert.units === 'C') {
                  units = '°' + alert.units;
                } else {
                  units = alert.units;
                }
                alert['reading'] = $filter('number')(alert.reading) + " " + units;
                if (alert.assetStatus.toUpperCase() === CONFIG_DATA.STATUS.green) {
                  alert['class'] = '#39e600';
                } else if (alert.assetStatus.toUpperCase() === CONFIG_DATA.STATUS.yellow) {
                  alert['class'] = '#ff9900';
                } else if (alert.assetStatus.toUpperCase() === CONFIG_DATA.STATUS.red) {
                  alert['class'] = '#ff0000';
                } else if (alert.assetStatus.toUpperCase() === CONFIG_DATA.STATUS.orange) {
                  alert['class'] = '#e24626';
                }
                response.data.push(alert);
              });

            }
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Alerts Information", JSON.stringify(error));
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
      .withOption('order', [5, 'desc'])
      .withOption('serverSide', true)
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER') + " " + $translate.instant('Menu.ASSETTYPE') + " " + $translate.instant('LABELS.NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.assetName + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.address + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.sensorName + ' </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p style="color:' + data.class + '"> ' + data.reading + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p style="color:' + data.class + '"> ' + data.alert + ' </p>';
      }),
      DTColumnBuilder.newColumn(null)
      .renderWith(function(data, type, full, meta) {
        return '<p>' + $filter('date')(data._created, 'MM-dd-yyyy HH:mm:ss a') + ' </p>';
      })
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

  })

  .controller('FilterInstanceCtrl', function($rootScope, $scope, $uibModalInstance, $compile, vm, alertsFactory, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.filter = alertsFactory.getAlertsFilter();

    $scope.filterData = function() {
      alertsFactory.setAlertsFilter($scope.filter);
      vm.dtInstance.reloadData(null, false);
      $uibModalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * alertsFactory used to set and get alerts filter data
   */
  .factory('alertsFactory', function($window, persistData) {
    var alertsFilter = {};

    alertsFilter.setAlertsFilter = function(filterData) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['alertsFilter'] = filterData;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };

    alertsFilter.getAlertsFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).alertsFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).alertsFilter;
      } else {
        return {
          assetName: '',
          sensorType: '',
          assetLocation: '',
          assetAlert: ''
        };
      }
    };
    return alertsFilter;
  });
