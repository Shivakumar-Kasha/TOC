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
angular.module('assetManagementApp').controller('TowerInfoCtrl', function($rootScope, $scope, $window, $compile, persistData, dataTable, toastNotifier, logReport, $filter, $translate, $uibModal, $log, $q, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, alertNotifier, dashboardService ) {
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
      .withOption('order', [1,"desc"])
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn('tenant_name').notSortable(),
      DTColumnBuilder.newColumn(null).renderWith(actionsHtml),
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
      vm.dtColumns[6].visible = false;
    } else {
      vm.dtColumns[6].visible = true;
    }

    /**
     * Server call with pagination
     * @param  {JSON} data
     * @param  {Function} fnCallback
     * @param  {JSON} oSettings
     * @return {Function} promise
     */
    function serverDataSource(data, fnCallback, oSettings) {

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
                //Service call to server to fetch data
                dashboardService.getAssetsService('all',data).then(function(result) {

                    logReport.info("Get Assets Result", JSON.stringify(result));
                    var response = getAssets(result);
                    fnCallback(response);
                  },
                  function(error) {
                    if (error.status === CONFIG_DATA.SERVER_RESPONSE.FAIL_CODE && error.data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN) {
                      utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
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

    // function actionsHtml(data, type, full, meta) {
    //   vm.assets[data.id] = data;
    //   return '<a></a>';
    // }
    function actionsHtml(data, type, full, meta) {
      vm.assets[data.id] = data;
      return '<a ui-sref="app.asset-info" ng-click="showCase.showAssetTnfo(showCase.assets[' + data.id + '])"> ' + data.name + ' </a>';
    }

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
