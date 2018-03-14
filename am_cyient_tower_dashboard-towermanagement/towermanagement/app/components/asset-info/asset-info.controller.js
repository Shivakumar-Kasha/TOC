/**
 * @Date:   02-16-2017 11:02:18
 * @Project: AssetMonitoring
 * @Last modified time: 12-06-2017 14:38:18
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch asset information
 */
angular.module('assetManagementApp').controller('AssetInfoCtrl', function($rootScope, $scope, $window, $filter, $compile, $translate, GeoCode, eachSeries, AssetInfoService, assetTypeService, dashboardService, tenantsService, persistData, dataTable, logReport, alertNotifier, toastNotifier, Session, DTOptionsBuilder, $uibModal, DTColumnBuilder, DTColumnDefBuilder, CONFIG_DATA, AUTH_EVENTS, USER_ROLES, utilityFunctions, zonesService) {
    var tenantId = JSON.parse($window.sessionStorage["sessionInfo"]).tenantId;
    alertNotifier.clearAlerts();
    $scope.tabs = [{
      heading: $translate.instant('LABELS.DETAILS'),
      content: "asset-details",
      isLoaded: false
    }];

    $scope.setTabContent = function(name) {
      $scope.tabContentUrl = "components/asset-info/" + name + ".html";
    };
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
      //  data.statusColor = data['status-class'];
      angular.forEach($scope.map.markers, function(record, index){
        record.show = false;
      });
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
    var draw = null;
    var TOKEN = Session.token;
    $rootScope.assetID = JSON.parse($window.sessionStorage["sessionInfo"]).assetId;
    var vm = this;
    vm.showChart = showChart;
    vm.updateBaseLocation = updateBaseLocation;
    vm.dtInstance = {};
    vm.sensors = [];
    $scope.assetFuel = 'No data available';
    $scope.assetTemperature = 'No data available';
    $scope.assetMovement = 'No data available';
    $scope.Level = 'No data available';
    var queryData = {
      userToken: Session.token,
      filter: [{
        key: 'c_assetId',
        value: $rootScope.assetID,
        filterType: 'eq'
      }],
      'paginationKey': ''
    };

    AssetInfoService.getAssetsVMService(tenantId, {
      userToken: Session.token,
      filter: [{
        key: 'c_assetId',
        value: $rootScope.assetID,
        filterType: 'eq'
      }],
      start: 0,
      length: 1
    }).then(function(result) {
        logReport.info("Info", JSON.stringify(result));
        if (utilityFunctions.isValid(result.data)) {
          var recordsArrayData = [];
          var data = result.data;
          var responseData = data.status;
          if (responseData === CONFIG_DATA.SERVER_RESPONSE.SUCCESS_CODE) {
            if (utilityFunctions.isValid(data.data.assets) && (data.data.assets.length !== 0)) {
              var assetInfo = data.data.assets[0];
              $scope.assetId = assetInfo.asset_id;
              $scope.assetsName = assetInfo.name;
              $scope.assetStatus = assetInfo.status;

              // var image = "";
              // if ($scope.assetStatus.toUpperCase() === CONFIG_DATA.STATUS.ok) {
              //   $scope.assetStatusClass = 'text-success';
              //   image = 'images/vendor/cold-storage-green.png';
              // } else if ($scope.warehouseStatus.toUpperCase() === CONFIG_DATA.STATUS.error) {
              //   $scope.assetStatusClass = 'text-danger';
              //   image = 'images/vendor/cold-storage-red.png';
              // } else if ($scope.warehouseStatus.toUpperCase() === CONFIG_DATA.STATUS.critical) {
              //   $scope.assetStatusClass = 'text-danger';
              //   image = 'images/vendor/cold-storage-red.png';
              // } else if ($scope.warehouseStatus.toUpperCase() === CONFIG_DATA.STATUS.warning) {
              //   $scope.assetStatusClass = 'text-warning';
              //   image = 'images/vendor/cold-storage-orange.png';
              // } else {
              //   $scope.assetStatusClass = 'text-yellow';
              //   image = 'images/vendor/cold-storage-yellow.png';
              // }
              // $scope.warehouseImage = image;
              $scope.assetLocation = assetInfo.address;

              if (Session.tenantType === 'Tenant') {
                if (persistData.isValid(assetInfo.zone_id)) {
                  var zoneId = assetInfo.zone_id;
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
                      $scope.zoneName = validData.data.records[0]._customInfo.c_name;
                    }
                  }, function(error) {
                    toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                  });
                } else {
                  $scope.zoneName = "Not Assigned";
                }
              }

              $scope.data = assetInfo.customProperties;

              $scope.propertiesData = function(propertiesData) {
                if (persistData.isValid(propertiesData.value)) {
                  $scope.propertyValue = propertiesData.value;
                } else {
                  $scope.propertyValue = $translate.instant('INFO.NO_DATA_AVAILABLE');
                }
              };

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
      },
      function(error) {
        if (error.status === CONFIG_DATA.SERVER_RESPONSE.FAIL_FORBIDDEN_CODE && error.data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
          if (utilityFunctions.isValid($rootScope.modalInstance)) {
            $rootScope.modalInstance.close();
          }
        } else {
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      });

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVICES.getDevices + tenantId,
        type: 'POST',
        data: function(data) {
          draw = data.draw;
          data.length = data.length;
          data.start = data.start;
          data.total = data.total;
          data.userToken = Session.token;
          data.assetId = $rootScope.assetID;
          data.filter = [];

          if (data.order[0].column === 0) {
            data.order = {
              dir: data.order[0].dir,
              column: 'deviceId'
            };
          } else if (data.order[0].column === 1) {
            data.order = {
              dir: data.order[0].dir,
              column: 'deviceName'
            };
          } else if (data.order[0].column === 2) {
            data.order = {
              dir: data.order[0].dir,
              column: 'internalName'
            };
          } else if (data.order[0].column === 3) {
            data.order = {
              dir: data.order[0].dir,
              column: 'label'
            };
          } else if (data.order[0].column === 4) {
            data.order = {
              dir: data.order[0].dir,
              column: 'value'
            };
          } else if (data.order[0].column === 5) {
            data.order = {
              dir: data.order[0].dir,
              column: 'modified'
            };
          }

          if (persistData.isValid(data.search.value)) {
            data["search"] = {
              searchType: "SW",
              value: data.search.value.toLowerCase()
            };
          }
          logReport.info('Get Devices input: ', JSON.stringify(data));
          return JSON.stringify(data);
        },
        headers: {
          "X-Kii-AppID": CONFIG_DATA.APP_ID,
          "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
          "Content-Type": "application/json",
        },
        beforeSend: function() {
          $rootScope.ajaxloading = true;
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$digest();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var sensorData = {
              draw: draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            };
            var sensorArrayData = [];
            var data = JSON.parse(result);
            if (utilityFunctions.isValid(data)) {
              var recordsArrayData = [];

              logReport.info(JSON.stringify(data));
              var responseData = data.status;
              if (responseData === CONFIG_DATA.SERVER_RESPONSE.SUCCESS_CODE) {
                sensorData['recordsTotal'] = data.data.recordsTotal;
                sensorData['recordsFiltered'] = data.data.recordsTotal;
                var roomSensors = data.data.deviceReadings;
                if (roomSensors.length === 0) {
                  sensorData = {
                    draw: draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                  };
                  return sensorData;
                } else {
                  angular.forEach(roomSensors, function(sensorInfo, key) {
                    var info = sensorInfo;
                    info['id'] = key;
                    // if (sensorInfo.sensorReading !== "") {
                    //   info['modifiedTime'] = $filter('date')(sensorInfo.modified, "MM/dd/yyyy HH:mm:ss");
                    // } else {
                    //   info['modifiedTime'] = "Never";
                    // }
                    info['modifiedTime'] = $filter('date')(sensorInfo.modified, "MM/dd/yyyy HH:mm:ss");
                    var units = sensorInfo.units;
                    if (utilityFunctions.isValid(units)) {
                      if (sensorInfo.units.toUpperCase() === 'F' || sensorInfo.units.toUpperCase() === 'C') {
                        units = '°' + sensorInfo.units.toUpperCase();
                      } else {
                        units = sensorInfo.units;
                      }
                    }

                    if (persistData.isValid(sensorInfo.sensorColor)) {
                      if (sensorInfo.sensorColor.toUpperCase() === CONFIG_DATA.STATUS.green) {
                        info['statusClass'] = "text-success";
                      } else if (sensorInfo.sensorColor.toUpperCase() === CONFIG_DATA.STATUS.yellow) {
                        info['statusClass'] = "text-yellow";
                      } else if (sensorInfo.sensorColor.toUpperCase() === CONFIG_DATA.STATUS.red) {
                        info['statusClass'] = "text-danger";
                      } else if (sensorInfo.sensorColor.toUpperCase() === CONFIG_DATA.STATUS.orange) {
                        info['statusClass'] = "text-warning";
                      } else {
                        info['statusClass'] = "text-success";
                      }
                    } else {
                      info['statusClass'] = "text-success";
                    }

                    if ((sensorInfo.value !== "-") && (sensorInfo.value !== "")) {
                      info['sensorStatus'] = sensorInfo.value + ' ' + units;
                    } else {
                      info['sensorStatus'] = $translate.instant('INFO.NO_DATA_AVAILABLE');
                      info['statusClass'] = "";
                    }

                    info['sensorUnits'] = units;
                    sensorArrayData.push(info);
                  });
                  sensorData['data'] = sensorArrayData;
                }
              } else {
                if ((persistData.isValid(data.errorCode)) && (data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN)) {
                  utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
                  if (utilityFunctions.isValid($rootScope.modalInstance)) {
                    $rootScope.modalInstance.close();
                  }
                } else if (responseData.toUpperCase() === CONFIG_DATA.FAIL && data.data.message.toUpperCase() === CONFIG_DATA.IN_VALID_TOKEN) {
                  utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
                  if (utilityFunctions.isValid($rootScope.modalInstance)) {
                    $rootScope.modalInstance.close();
                  }
                }
              }
            }
            return sensorData;
          },
          error: function(error) {
            logReport.error("Get Rooms information:" + JSON.stringify(error));
            if (error.status === CONFIG_DATA.SERVER_RESPONSE.FAIL_FORBIDDEN_CODE && error.data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN) {
              utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
              if (utilityFunctions.isValid($rootScope.modalInstance)) {
                $rootScope.modalInstance.close();
              }
            } else {
              toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
            }
          }
        }
      })
      .withDataProp(function(data) {
        logReport.info("Sensor Data:" + JSON.stringify(data));
        return data.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_DEVICE_NAME')
      })
      .withOption('createdRow', createdRow)
      .withOption('order', [5, 'desc'])
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn('deviceId'),
      DTColumnBuilder.newColumn('deviceName'),
      DTColumnBuilder.newColumn('internalName'),
      DTColumnBuilder.newColumn('label'),
      DTColumnBuilder.newColumn(null).renderWith(function(data, type, full, meta) {
        return '<p class="' + data.statusClass + '">' + data.sensorStatus + '</p>';
      }),
      DTColumnBuilder.newColumn('modifiedTime')
      // DTColumnBuilder.newColumn(null).notSortable().renderWith(function(data, type, full, meta) {
      //   vm.sensors[data.id] = data;
      //   if (((data.sensorName.toUpperCase()).indexOf("DOOR") > -1) || ((data.sensorName.toUpperCase()).indexOf("MOTION") > -1)) {
      //     return '<div class="text-center"><span class="fa-stack fa-lg">  <i class="fa fa-line-chart fa-stack-1x"></i>  <i class="fa fa-ban fa-stack-2x text-danger"></i></span></div>';
      //   } else {
      //     return '<div class="text-center"><a ng-click="whInfo.showChart(' + data.id + ')" href ><i class="fa fa-2x fa-line-chart" aria-hidden="true"></i></a></div>';
      //   }
      //
      // })
    ];

    /*
      Function to open Trend Chart
     */

    function showChart(id) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'trendGraphInfoPopUpPrompt.html',
        controller: 'TrendGraphInfoCtrl',
        backdrop: 'static',
        keyboard: true,
        size: 'lg',
        resolve: {
          sensorData: function() {
            vm.sensors[id].assetId = $scope.assetId;
            return vm.sensors[id];
          }
        }
      });

      $rootScope.modalInstance.result.then(function(selectedItem) {
        $scope.selected = selectedItem;
      }, function() {
        logReport.info('Chart modal dismissed at: ' + new Date());
      });

    }


    /*  Update Base Location */

    function updateBaseLocation(id) {

      AssetInfoService.updateBaseLocation({
        userToken: Session.token,
        assetId: $scope.assetId,
        sensorId: vm.sensors[id].c_id
      }).
      then(function(result) {
        var data = result.data;
        logReport.info(JSON.stringify(data));
        var response = data.returnedValue.status;
        var message = data.returnedValue.message;
        if (response === CONFIG_DATA.SUCCESS) {
          toastNotifier.showSuccess($translate.instant('ASSET_INFO.SUCCESS.LOCATION_RESET'));
          $scope.assetLocation = data.returnedValue.data.address;
          //$scope.movementBgColor = 'text-success';
          vm.dtInstance.reloadData();
        } else if (response === CONFIG_DATA.FAIL &&
          message === CONFIG_DATA.UN_AUTHORIZED_USER) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
        } else if (response === CONFIG_DATA.FAIL &&
          message !== CONFIG_DATA.UN_AUTHORIZED_USER) {
          logReport.error(JSON.stringify(data));
          toastNotifier.showError($translate.instant('ASSET_INFO.ERROR.LOCATION_RESET'));
        }
      }, function(error) {
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        logReport.error(JSON.stringify(error));
      });
    }

    /*  Update Base Location */

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

  })

  /**
   * Controller to show trend graph of sensor
   */
  .controller('TrendGraphInfoCtrl', function($scope, $translate, $filter, CONFIG_DATA, AUTH_EVENTS, Session, persistData, logReport, toastNotifier, usersService, AssetInfoService, sensorData, alertNotifier) {
    alertNotifier.clearAlerts();
    var paginationKey = "";
    $scope.sensorName = sensorData.c_name;
    $scope.sensorUnits = sensorData.units;
    // It's containing Trend Graph paginationKey.
    $scope.paginationKey = "";
    // It's containing Trend Graph paginationKey prev Key Flag.
    $scope.prevKeyFlag = false;
    // It's containing Trend Graph paginationKey next Key Flag.
    $scope.nextKeyFlag = false;
    // It's containing paging Data.
    $scope.pagingData = {
      countPrev: 0,
      prevKey: "",
      nextKey: ""
    };
    $scope.trend = {
      fromDate: new Date(),
      toDate: new Date(),
      length: '10'
    };

    $scope.clear = function() {
      $scope.from = null;
    };

    $scope.disabled = function(date, mode) {
      return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
    };

    /**
     * This is for toggle Min.
     * @return {void}
     */
    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    /**
     * This is for open callender.
     * @return {void}
     */
    $scope.open = function($event, id) {
      $event.preventDefault();
      $event.stopPropagation();
      if (id === 'from') {
        $scope.opened_from = true;
      } else if (id === 'to') {
        $scope.opened_to = true;
      }
    };

    // It's containing date options.
    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      'class': 'datepicker'
    };
    $scope.searchSensorReadings = function() {
      $scope.pagingData = {
        countPrev: 0,
        prevKey: "",
        nextKey: ""
      };
      $scope.paginationKey = '';
      $scope.getSensorReadings(false);
    };

    // It's containing format of date options.
    $scope.formats = ['dd-MMMM-yyyy', 'dd-MM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'MM/dd/yyyy', 'shortDate'];
    // selected date format
    $scope.format = $scope.formats[4];

    $scope.getSensorReadings = function(isSearch) {

      var startDate = new Date($scope.trend.fromDate);
      startDate.setHours(0, 0, 0, 0);
      var endDate = new Date($scope.trend.toDate);
      endDate.setHours(23, 59, 59, 999);

      if (startDate.getTime() > endDate.getTime()) {
        toastNotifier.showWarning($translate.instant('INFO.FROM_DATE_SHOULD_LESS_THAN_DATE'));
        return false;
      }
      var postData = {
        userToken: Session.token,
        assetId: sensorData.assetId,
        sensorName: sensorData.c_name,
        fromDateTime: startDate.getTime(),
        toDateTime: endDate.getTime(),
        length: parseInt($scope.trend.length),
        paginationKey: $scope.paginationKey
      };
      if (isSearch) {
        postData.nextPaginationKey = '';
        postData.userToken = Session.token;
        $scope.prevKeyFlag = false;
        $scope.nextKeyFlag = false;
        $scope.allSensorReadingData = [];
        $scope.pagingData = {
          countPrev: 0,
          prevKey: "",
          nextKey: ""
        };
      }
      logReport.info("Input for getSensorReadings", JSON.stringify(postData));
      AssetInfoService.getSensorReadings(postData).then(function(result) {
          logReport.info("Sensor Readings", JSON.stringify(result));
          var res = [];
          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('ASSET_INFO.ERROR.SENSOR_READINGS_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          if (Object.keys(validData).length !== 0) {
            $scope.paginationKey = validData.nextPaginationKey;
            if ($scope.prevKeyFlag) {
              $scope.nextKeyFlag = true;
            }
            if ($scope.paginationKey !== "" && $scope.paginationKey !== undefined && $scope.paginationKey !== null) {
              $scope.prevKeyFlag = true;
            } else {
              $scope.prevKeyFlag = false;
            }
            var records = validData.data.records;
            records.reverse();
            if (records.length !== 0) {
              angular.forEach(records, function(record) {
                //var time = $filter('date')(record._created, "MM/dd/yyyy HH:mm:ss");
                var time = $filter('date')(record._created, "yyyy-MM-dd HH:mm:ss");
                res.push({
                  time: time,
                  reading: record.sensorReading
                });
              });
              logReport.info("@@@@@@@@" + JSON.stringify(res));
              $scope.sensorReadings = res;
            } else {
              $scope.sensorReadings = [{
                time: "No data available",
                reading: null
              }];
            }
          }
        },
        function(error) {
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
    /**
     * This function for trend Graph Previous and Next.
     * @param  {String} paginationType
     * @return {void}
     */
    $scope.trendGraphNext = function(paginationType) {
      if (paginationType === 'next') {
        logReport.info("pagingData", JSON.stringify($scope.pagingData));
        if ($scope.paginationKey !== '' && $scope.pagingData.countPrev > 0) {
          var paginationKeyPrev = $scope.pagingData.prevKey.split("/")[0] + "/" + ($scope.pagingData.prevKey.split("/")[1] - parseInt($scope.trend.length));
          $scope.paginationKey = paginationKeyPrev;
          $scope.pagingData.countPrev--;
          $scope.pagingData.prevKey = paginationKeyPrev;
          $scope.getSensorReadings(false);
        } else {
          $scope.nextKeyFlag = false;
        }
        if (($scope.paginationKey.split("/")[1] - parseInt($scope.trend.length)) < 0) {
          $scope.nextKeyFlag = false;
        }
      } else if (paginationType === 'prev') {
        if ($scope.paginationKey !== "" && $scope.paginationKey !== undefined && $scope.paginationKey !== null) {
          $scope.pagingData.prevKey = $scope.paginationKey;
          $scope.getSensorReadings(false);
          $scope.pagingData.countPrev++;
          $scope.prevKeyFlag = true;
        }
      }
    };
  });
