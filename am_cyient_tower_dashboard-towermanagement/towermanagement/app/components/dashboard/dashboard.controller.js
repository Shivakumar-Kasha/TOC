/**
 * @Date:   02-24-2017 17:02:89
 * @Project: AssetMonitoring
 * @Last modified time: 12-05-2017 14:31:29
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch data based on filter and show on map and list
 */
angular.module('assetManagementApp').controller('DashboardCtrl', function($rootScope, $scope, $window, $state, $compile, $timeout, $filter, $sanitize, $translate, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, USER_ROLES, GeoCode, modelsService, currentLocation, dashboardFactory, utilityFunctions, dashboardService, dataTable, persistData, logReport, alertNotifier, zonesService, toastNotifier) {


    var draw = null;
    var tottowers=null;

    var vm = this;
    vm.showAssetTnfo = showAssetTnfo;
    vm.dtInstance = {};
    vm.assets = {};
    vm.delete = deleteAsset;
    var geocoder = new $window.google.maps.Geocoder();

    $scope.map = {
      center: {
        latitude: 38.68551,
        longitude: -96.503906
      },
      bounds: [],
      zoom: 4,
      pan: 1,
      options: {
        minZoom: 1,
        zoomControl: true,
        draggable: true,
        navigationControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        mapTypeId: $window.google.maps.MapTypeId.ROADMAP,
        disableDoubleClickZoom: false,
        keyboardShortcuts: true,
        styles: [{
          featureType: "poi",
          elementType: "labels",
          stylers: [{
            visibility: "off"
          }]
        }, {
          featureType: "transit",
          elementType: "all",
          stylers: [{
            visibility: "off"
          }]
        }],
      },
      control: {},
      markers: []
    };

    uiGmapIsReady.promise()
      .then(function(map_instances) {
        var mapInstance = map_instances[0].map; // get map object through array object returned by uiGmapIsReady promise

        $window.google.maps.event.addListener(mapInstance, 'zoom_changed', function() {});

        $window.google.maps.event.addListener(mapInstance, 'dragend', function() {});

        $window.google.maps.event.addListener(mapInstance, 'idle', function() {
          var bounds = mapInstance.getBounds();
          var ne = bounds.getNorthEast(); // LatLng of the north-east corner
          var sw = bounds.getSouthWest(); // LatLng of the south-west corder
          logReport.info("Map Bounds", JSON.stringify(mapInstance.getBounds()));
          logReport.info("Map Center", JSON.stringify(mapInstance.getCenter()));
        });
      });

      $scope.showNxtLvlDataAlarms = function(sensorType) {
        var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
        sessionInfo['sensorType'] = sensorType;
        $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
        $state.go('app.alarms');
      };
      $scope.showNxtLvlData = function(ticketStatus,statusFilterType) {
        var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
        sessionInfo['ticketStatus'] = ticketStatus;
        sessionInfo['statusFilterType'] = statusFilterType;
        $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
        $state.go('app.tickets');
      };
      $scope.showNxtLvlData1 = function(ticketStatus,statusFilterType) {
        var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
        sessionInfo['ticketStatus'] = ticketStatus;
        sessionInfo['statusFilterType'] = statusFilterType;
        $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
        $state.go('app.tickets');
      };
      $scope.showNxtLvlDataTopAlarmsAndAlerts = function(fetchBy) {
        var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
        sessionInfo['fetchBy'] = fetchBy;
        $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
        $state.go('app.topAlertsAndAlarms');
      };

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
      var dashboardFilterData = dashboardFactory.getDashboardFilter();
      draw = data.draw;
      data.userToken = Session.token;
      data.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + data.start;
      data.filter = [];
      if (data.order[0].column === 1) {
        data.order = {
          dir: data.order[0].dir,
          column: 'name'
        };
      } else if (data.order[0].column === 2) {
        data.order = {
          dir: data.order[0].dir,
          column: 'address'
        };
      } else if (data.order[0].column === 5) {
        data.order = {
          dir: data.order[0].dir,
          column: 'status'
        };
      }

      if (dashboardFilterData.status !== 'All') {
        data.filter.push({
          key: 'status',
          value: dashboardFilterData.status,
          filterType: 'eq'
        });
      }

      if (persistData.isValid(dashboardFilterData.model)) {
        data.filter.push({
          key: 'model_id',
          value: dashboardFilterData.model,
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
        if (persistData.isValid(dashboardFilterData.tenantId)) {
          tenantIdSelected = dashboardFilterData.tenantId;
        } else {
          tenantIdSelected = 'all';
        }
      } else {
        tenantIdSelected = Session.tenantId;
      }

      if (dashboardFilterData.val !== 100) {
        if (!persistData.isValid(dashboardFilterData.address)) {
          currentLocation.location()
            .then(function(myCurrentLocation) {
                data.filter.push({
                  latValue: myCurrentLocation.latitude,
                  lonValue: myCurrentLocation.longitude,
                  radius: dashboardFilterData.val,
                  filterType: "GQ"
                });

                $scope.map.center = {
                  latitude: myCurrentLocation.latitude,
                  longitude: myCurrentLocation.longitude
                };

                logReport.info("Get Assets Query", JSON.stringify(data));

                //Service call to server to fetch data
                dashboardService.getAssetsService(tenantIdSelected, data).then(function(result) {
                    var response = getAssets(result);
                    fnCallback(response);
                  },
                  function(error) {
                    if (error.status === CONFIG_DATA.SERVER_RESPONSE.FAIL_CODE && error.data.errorCode.toUpperCase() === CONFIG_DATA.SERVER_RESPONSE.WRONG_TOKEN) {
                      utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'))
                      if (persistData.isValid($rootScope.modalInstance)) {
                        $rootScope.modalInstance.close();
                      }
                    } else {
                      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                    }
                  });

                geocoder.geocode({
                    'location': {
                      lat: myCurrentLocation.latitude,
                      lng: myCurrentLocation.longitude
                    }
                  }, function(results, status) {
                    if (status === 'OK') {
                      if (results[1]) {
                        dashboardFilterData.address = results[1].formatted_address;
                        dashboardFactory.setDashboardFilter(dashboardFilterData);
                      } else {
                        logReport.info('No results found');
                      }
                    } else {
                      logReport.error('Geocoder failed', status);
                    }
                  },
                  function(error) {
                    logReport.error('Geocoder error', JSON.stringify(error));
                  });
              },
              function(error) {
                logReport.error("Current Location By Latitude And Longitude", JSON.stringify(error));
              });
        } else {
          GeoCode.latLong(dashboardFilterData.address)
            .then(function(results) {
              if (results[0]) {
                data.filter.push({
                  latValue: results[0].geometry.location.lat(),
                  lonValue: results[0].geometry.location.lng(),
                  radius: dashboardFilterData.val,
                  filterType: "GQ"
                });

                $scope.map.center = {
                  latitude: results[0].geometry.location.lat(),
                  longitude: results[0].geometry.location.lng()
                };

                logReport.info("Get Assets Query", JSON.stringify(data));

                //Service call to server to fetch data
                dashboardService.getAssetsService(tenantIdSelected, data).then(function(result) {
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
              } else {
                alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
              }
            }, function(error) {
              alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
            });
        }
      } else {
        //Service call to server to fetch data
        dashboardService.getAssetsService(tenantIdSelected, data).then(function(result) {
            var response = getAssets(result);
            fnCallback(response);
          },
          function(error) {
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
              coords: {
                latitude: $scope.map.center.latitude,
                longitude: $scope.map.center.longitude
              },
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
              angular.forEach(data, function(value, key) {
                if (typeof value !== 'object' && typeof value !== 'Array') {
                  try {
                    data[key] = $sanitize(((value + "").toString()).replace(new RegExp("<style>[^]*</style>|<style>[^]*|</style>", 'g'), ''));
                  } catch (error) {
                    logReport.error(error);
                  }
                }
              });
              var image = "";
              var status = data.status;
              var assetName = "";
              if (persistData.isValid(data.asset_type_info)) {
                assetName = data.asset_type_info._customInfo.c_name;
              } else {
                assetName = data.asset_type_name;
              }


                if (status.toUpperCase() === CONFIG_DATA.STATUS.ok) {
                  data['status-class'] = 'text-success';
                  image = 'images/vendor/location-green.png';
                } else if (status.toUpperCase() === CONFIG_DATA.STATUS.error) {
                  data['status-class'] = 'text-danger';
                  image = 'images/vendor/location-red.png';
                } else if (status.toUpperCase() === CONFIG_DATA.STATUS.warning) {
                  data['status-class'] = 'text-yellow';
                  image = 'images/vendor/location-yellow.png';
                }

              var markerObj = {
                id: index,
                coords: {
                  latitude: data.location_lat,
                  longitude: data.location_lon
                },
                data: data,
                icon: {
                  url: image, // url
                  scaledSize: new $window.google.maps.Size(30, 37), // scaled size
                },
                options: {
                  title: data.name
                },
                show: false
              };
              markersArrayData.push(markerObj);
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

      $scope.map.markers = markersArrayData;
      var myBounds = new $window.google.maps.LatLngBounds();
      angular.forEach($scope.map.markers, function(value, key) {
        var myLatLng = new $window.google.maps.LatLng($scope.map.markers[key].coords.latitude, $scope.map.markers[key].coords.longitude);
        myBounds.extend(myLatLng);
      });
      $scope.map.bounds = {
        northeast: {
          latitude: myBounds.getNorthEast().lat(),
          longitude: myBounds.getNorthEast().lng()
        },
        southwest: {
          latitude: myBounds.getSouthWest().lat(),
          longitude: myBounds.getSouthWest().lng()
        }
      };
      return response;
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionDeleteHtml(data, type, full, meta) {
      vm.assets[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="showCase.delete(showCase.assets[' + data.id + '])" )"="" ng-disabled= "{{disableDeleteAssetTypeButton}}">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    function actionsHtml(data, type, full, meta) {
      vm.assets[data.id] = data;
      return '<a ui-sref="app.asset-info" ng-click="showCase.showAssetTnfo(showCase.assets[' + data.id + '])"> ' + data.name + ' </a>';
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

    $scope.closeClick = function() {
      $scope.windowOptions.show = false;
    };

    function showAssetTnfo(data) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['assetId'] = data.asset_id;
      sessionInfo['tenantId'] = data.tenat_admin_group_id.split('_')[0];
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    }

    /**
     * Function to delete sensor information
     * @param  {JSON} sensorInfo
     */
    function deleteAsset(assetInfo) {
      logReport.info(JSON.stringify(assetInfo))
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteAssetPrompt.html',
        controller: 'DeleteAssetCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assetInfo: function() {
            return assetInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

    $scope.openFilter = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'dashboardFilterPrompt.html',
        controller: 'DashboardFilterCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
    };

    $scope.resetDashboardFilter = function() {
      dashboardFactory.setDashboardFilter('');
      vm.dtInstance.reloadData();
    };

    $scope.loadCharts = function() {
      $scope.chartsContentUrl = "components/dashboard/charts.view.html";
    };

$scope.getOverView = function() {
    dashboardService.getOverView().then(function(result) {

      logReport.info("Dashboard data" +JSON.stringify(result));

      var data = result.data.data;
      logReport.info("Dashboard data" +JSON.stringify(data));

      $scope.activeUsers=data.activeCustomers;
      $scope.totalTowers=data.totalTowers;
      //tottowers=$scope.totalTowers;
      console.log("????????? Length",tottowers);
      $scope.ticketsPending=data.ticketsPending;
      $scope.ticketsResolved=data.ticketsResolved;
      $scope.overallHealth=data.overallHealth;
      $scope.unattendedAlarms=data.unattendedAlarms;
    })
  };

    dashboardService.getTowerList().then(function(result){


    })





$scope.getPowerConsumptionCatagory = function() {
    dashboardService.getPowerConsumptionCatagory().then(function(result){
      logReport.info("Dashboard data" +JSON.stringify(result));

      var data = result.data.data;
      //alert(data);
      console.log("#######", Object.values(data))
      $scope.labels = Object.keys(data)
          $scope.data = Object.values(data);
          $scope.options = {
            legend: {
              display: true,
              position: 'right'
            }
          };
      logReport.info("Dashboard data" +JSON.stringify(data));
    })
};

$scope.getGpPowerVsDgPower = function() {
  var params = {
    fromDate: '2018-01-01',
    toDate: '2018-03-31'
  };
dashboardService.getGpPowerVsDgPower(params).then(function(result){
  logReport.info("Dashboard data" +JSON.stringify(result));

  var data = result.data.data.gpPowerVsDgPower;
  var legendData=[];
  var gpPowerArray=[];
  var dgPowerArray=[];
  angular.forEach(data, function(data1) {

    console.log("Grid#######", JSON.stringify(data1));

    legendData.push(data1.time)
    gpPowerArray.push(data1.gpPower)
    dgPowerArray.push(data1.dgPower)



  })
  console.log("Time#######", JSON.stringify(legendData));
  console.log("gpPower#######", JSON.stringify(gpPowerArray));
  console.log("dgPower#######", JSON.stringify(dgPowerArray));

  // Grid
  $scope.gridLabels = legendData;
  $scope.gridSeries = ['GP Power', 'DG Power'];

  $scope.gridData = [
    gpPowerArray,
    dgPowerArray
  ];
  $scope.gridColors = [{
      borderColor: "rgb(18, 171, 235)",
    },


  ];
  $scope.onClickGpVsDg = function(points, evt) {
    console.log(points, evt);
  };
  $scope.gridDataSetOverride = [{
    yAxisID: 'y-axis-1'
  }, {
    yAxisID: 'y-axis-2'
  }];
  $scope.gridOptions = {
    scales: {
      yAxes: [{
          id: 'y-axis-1',
          type: 'linear',
          display: true,
          position: 'left'
        },
        {
          id: 'y-axis-2',
          type: 'linear',
          display: true,
          position: 'right',

        }
      ]
    }
  };

      // console.log("#######", Object.keys(data))
      // console.log("#######", Object.values(data))

    })

};

$scope.getTopAlarms = function() {
    dashboardService.getTopAlarms().then(function(result){
      logReport.info("Dashboard data" +JSON.stringify(result));


      var data = result.data.data;

      var alarmArray=[];
      var countArray=[];
      angular.forEach(data, function(data1) {

        console.log("Alarm#######", JSON.stringify(data1));


        alarmArray.push(data1.alarm)
        countArray.push(data1.count)



      })
      console.log("Alarm#######", JSON.stringify(alarmArray));
      console.log("Count#######", JSON.stringify(countArray));

      //Alarms
      $scope.alarmsLabels = alarmArray;
      $scope.alarmSeries = ['count'];
      $scope.colors = [{
        backgroundColor: "rgb(18, 171, 235)",
        hoverBackgroundColor: "rgb(18, 171, 235)",
        hoverBorderColor: "rgb(18, 171, 235)"
      }];

      $scope.alarmsData = countArray;
      $scope.alarmsOptions = {
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Count'
            }
          }]
        }
      };



        })
};

$scope.getTopAlerts = function() {
        dashboardService.getTopAlerts().then(function(result){
          logReport.info("Dashboard data" +JSON.stringify(result));


          var data = result.data.data;

          var alertArray=[];
          var countArray=[];
          angular.forEach(data, function(data1) {

            console.log("Alerts#######", JSON.stringify(data1));


            alertArray.push(data1.alert)
            countArray.push(data1.count)



          })
          console.log("Alert#######", JSON.stringify(alertArray));
          console.log("Count#######", JSON.stringify(countArray));

          //Alerts
          $scope.alertsLabels = alertArray;
          $scope.alertSeries = ['count'];
          $scope.colors = [{
            backgroundColor: "rgb(18, 171, 235)",
            hoverBackgroundColor: "rgb(18, 171, 235)",
            hoverBorderColor: "rgb(18, 171, 235)"
          }];

          $scope.alertsData = countArray;
          $scope.alertsOptions = {
            scales: {
              xAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: 'Count'
                }
              }]
            }
          };



            })

};

$scope.getAlarmTrends = function() {
  var params = {
    fromDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime(), "yyyy-MM-dd"),
    toDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime(), "yyyy-MM-dd")
  };


            dashboardService.getAlarmTrends(params).then(function(result){

              logReport.info("Dashboard data" +JSON.stringify(result));

              var data = result.data.data;
              logReport.info("Dashboard data" +JSON.stringify(data));
              var timeArray=[];
              var alarmCountArray=[];
              angular.forEach(data, function(data1) {

                console.log("Alarms#######", JSON.stringify(data1));


                timeArray.push(data1.time)
                alarmCountArray.push(data1.alarmCount)



              })
              console.log("timeArray#######", JSON.stringify(timeArray));
              console.log("alarmCountArray#######", JSON.stringify(alarmCountArray));

              //Alarm Trends
              $scope.alarmtrendslabels = timeArray;
              $scope.series = ['time','count'];
              $scope.colors = [{
                borderColor: "rgb(18, 171, 235)",
              }];
              $scope.alarmtrendsdata = alarmCountArray;
              $scope.onClickAlarmTrends = function(points, evt) {
                console.log(points, evt);
              };
              $scope.datasetOverride = [{
                yAxisID: 'y-axis-1'
              }];
              $scope.alarmtrendsoptions = {
                scales: {
                  yAxes: [{
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left'
                  }]
                }
              };
            })

};

$scope.getFireAndSmokeTrends = function() {
  var params = {
    fromDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime(), "yyyy-MM-dd"),
    toDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime(), "yyyy-MM-dd")
  };

            dashboardService.getFireAndSmokeTrends(params).then(function(result)
               {
                  logReport.info("Dashboard data" +JSON.stringify(result));
                   var data = result.data.data;
                   var timeArray=[];
                   var countArray=[];
                   angular.forEach(data, function(data1) {
                     console.log("Fire#######", JSON.stringify(data1));
                     timeArray.push(data1.time)
                     countArray.push(data1.count)
                })
                console.log("time#######", JSON.stringify(timeArray));
                console.log("count#######", JSON.stringify(countArray));

                   $scope.fireLabels =timeArray ;
                   $scope.fireSeries = ['time','count'];
                   $scope.fireColors = [{
                     backgroundColor: "rgb(18, 171, 235)",
                     hoverBackgroundColor: "rgb(18, 171, 235)",
                     hoverBorderColor: "rgb(18, 171, 235)"
                   }];

                   $scope.fireData = countArray;
                   $scope.fireOptions = {
                     scales: {
                       yAxes: [{
                         scaleLabel: {
                           display: true
                          // labelString: 'ProductID'
                         }
                       }]
                     }
                   };
              })
};
$scope.getIntrusionsDetected = function() {
  var params = {
    fromDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime(), "yyyy-MM-dd"),
    toDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime(), "yyyy-MM-dd")
  };
              dashboardService.getIntrusionsDetected(params).then(function(result)
                 {
                    logReport.info("Dashboard data" +JSON.stringify(result));
                     var data = result.data.data;
                     var timeArray=[];
                     var countArray=[];
                     angular.forEach(data, function(data1) {
                       console.log("Fire#######", JSON.stringify(data1));
                       timeArray.push(data1.time)
                       countArray.push(data1.count)
                  })
                  console.log("time#######", JSON.stringify(timeArray));
                  console.log("count#######", JSON.stringify(countArray));

                  //Intrusions
                  $scope.intrusionsLabels = timeArray;
                  $scope.intrusionsSeries = ['time','count'];
                  $scope.intrusionColors = [{
                    borderColor: "rgb(18, 171, 235)",
                  }];
                  $scope.intrusionsData = countArray;
                  $scope.onClickIntrusions = function(points, evt) {
                    console.log(points, evt);
                  };
                  $scope.intrusionsDataSetOverride = [{
                    yAxisID: 'y-axis-1'
                  }];
                  $scope.intrusionsOptions = {
                    scales: {
                      yAxes: [{
                        id: 'y-axis-1',
                        type: 'linear',
                        display: true,
                        position: 'left'
                      }]
                    }
                  };


                })

};

$scope.getVoltageDCAlarms = function() {
  var params = {
    fromDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime(), "yyyy-MM-dd"),
    toDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime(), "yyyy-MM-dd")
  };

                dashboardService.getVoltageDCAlarms(params).then(function(result)
                   {
                      logReport.info("Dashboard data" +JSON.stringify(result));
                       var data = result.data.data;
                       var timeArray=[];
                       var countArray=[];
                       angular.forEach(data, function(data1) {
                         console.log("Fire#######", JSON.stringify(data1));
                         timeArray.push(data1.time)
                         countArray.push(data1.count)
                    })
                    console.log("time#######", JSON.stringify(timeArray));
                    console.log("count#######", JSON.stringify(countArray));

                    //Battery
                    $scope.BatteryLabels = timeArray;
                    $scope.batterySeries = ['time','count'];
                    $scope.colors = [{
                      backgroundColor: "rgb(18, 171, 235)",
                      hoverBackgroundColor: "rgb(18, 171, 235)",
                      hoverBorderColor: "rgb(18, 171, 235)"
                    }];

                    $scope.BatteryData = countArray;
                    $scope.BatteryOptions = {
                      scales: {
                        yAxes: [{
                          scaleLabel: {
                            display: true,
                            //labelString: 'CustomerID'
                          }
                        }]
                      }
                    };



                  })

};

$scope.getDgFuelConsumption = function() {
  var params = {
    fromDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime(), "yyyy-MM-dd"),
    toDate: $filter('date')(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime(), "yyyy-MM-dd")
  };

  dashboardService.getDgFuelConsumption(params).then(function(result)
     {
        logReport.info("Dashboard data" +JSON.stringify(result));
         var data = result.data.data;
         var timeArray=[];
         var countArray=[];
         angular.forEach(data, function(data1) {
           console.log("Fire#######", JSON.stringify(data1));
           timeArray.push(data1.time)
           countArray.push(data1.count)
      })
      console.log("time#######", JSON.stringify(timeArray));
      console.log("count#######", JSON.stringify(countArray));

      //Fuel
      $scope.FuelLabels = timeArray;
      $scope.fuelSeries = ['CustomerID'];
      $scope.colors = [{
        backgroundColor: "rgb(18, 171, 235)",
        hoverBackgroundColor: "rgb(18, 171, 235)",
        hoverBorderColor: "rgb(18, 171, 235)"
      }];

      $scope.FuelData = countArray;
      $scope.FuelOptions = {
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              //labelString: 'CustomerID'
            }
          }]
        }
      };

})
};

})





  /**
   * Controller to filter data
   */
  .controller('DashboardFilterCtrl', function($scope, $window, $uibModalInstance, CONFIG_DATA, USER_ROLES, $compile, vm, persistData, tenantsService, dashboardFactory, dataTable, Session, logReport, toastNotifier, alertNotifier, modelsService, $translate) {

    //alertNotifier.clearAlerts();
    $scope.statusOptions = CONFIG_DATA.DASHBOARD.OPTIONS;

    $scope.filter = dashboardFactory.getDashboardFilter();

    angular.element('#slider').on('slideStop', function(data) {
      updateModel(data.value);
    });

    $scope.updateModel = function(data) {
      $scope.$apply(function() {
        $scope.filter.val = data.value;
      });
    };

    modelsService.getModels({
      userToken: Session.token,
      filter: []
    }).then(function(result) {
      var customInfo = {
        successMessage: "",
        alreadyExists: "",
        errorMessage: $translate.instant('MODELS.ERROR.RETRIEVE_FAIL')
      };

      var validData = persistData.validifyData(result, customInfo);

      if (Object.keys(validData).length !== 0) {
        $scope.models = validData.data.records;
      }
    }, function(error) {
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });


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

    $scope.filterData = function() {
      if (persistData.isValid($scope.filter.tenantId)) {
        angular.forEach($scope.tenants, function(tenant) {
          if (tenant._customInfo.c_id === $scope.filter.tenantId) {
            $scope.filter.selectedDashboardTenant = tenant._customInfo.c_name;
          }
        });
      } else {
        $scope.filter.selectedDashboardTenant = '';
      }
      dashboardFactory.setDashboardFilter($scope.filter);
      vm.dtInstance.reloadData();
      $uibModalInstance.dismiss('cancel');
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * dashboardFactory used to set and get dashboard filter data
   */

  .factory('dashboardFactory', function($window, persistData) {
    var dashboardFilter = {};

    dashboardFilter.setDashboardFilter = function(filterData) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['dashboardFilter'] = filterData;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };
    dashboardFilter.getDashboardFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).dashboardFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).dashboardFilter;
      } else {
        return {
          val: 20,
          status: 'All',
          tenantId: '',
          model: '',
          address: '',
          selectedDashboardTenant: ''
        };
      }
    };
    return dashboardFilter;
  })

  .controller('dataMapsRegionCtrl', function($scope) {
    $scope.mapObject = {
      scope: 'world',
      options: {
        width: 300,
        height: 300,
        legendHeight: 100 // optionally set the padding for the legend
      },
      geographyConfig: {
        highlighBorderColor: '#EAA9A8',
        highlighBorderWidth: 2
      },
      fills: {
        'HIGH': '#CC4731',
        'MEDIUM': '#306596',
        'LOW': '#667FAF',
        'defaultFill': '#DDDDDD'
      },
      data: {
        "AZ": {
          "fillKey": "MEDIUM",
        },
        "CO": {
          "fillKey": "HIGH",
        },
        "DE": {
          "fillKey": "LOW",
        },
        "GA": {
          "fillKey": "MEDIUM",
        }
      },
    }
  })


// .controller('MainCtrl', function($scope) {
//
//       $scope.shareLabels = ["Cameras", "Cell Phones", "Computer", "Games", "TV & Home Theater"];
//       $scope.shareData = [681, 686, 777, 816, 1020];
//       $scope.shareOptions = {
//         legend: {
//           display: true,
//           position: 'right'
//         }
//       };
//
//       $scope.donutLabels = ["", "", ""];
//       $scope.donutData = [0, 13248515, 20301181];
//
//     })
//
//
//   .controller('LineCtrl', function($scope) {
//         //Alarm Trends
//         $scope.labels = ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016'];;
//         $scope.series = ['ProductID'];
//         $scope.colors = [{
//           borderColor: "rgb(18, 171, 235)",
//         }];
//         $scope.data = [
//           [273, 226, 240, 277, 317, 331, 444, 474, 373, 363, 345, 406],
//         ];
//         $scope.onClick = function(points, evt) {
//           console.log(points, evt);
//         };
//         $scope.datasetOverride = [{
//           yAxisID: 'y-axis-1'
//         }];
//         $scope.options = {
//           scales: {
//             yAxes: [{
//               id: 'y-axis-1',
//               type: 'linear',
//               display: true,
//               position: 'left'
//             }]
//           }
//         };
//         // Grid
//         $scope.gridLabels = ['Jan 2018', 'Feb 2018', 'Mar 2018', 'Apr 2018', 'May 2018', 'Jun 2018', 'Jul 2018', 'Aug 2018', 'Sep 2018', 'Oct 2018', 'Nov 2018', 'Dec 2018'];;
//         $scope.gridSeries = ['CustomerID', 'TrendLine(CustomerID)'];
//
//         $scope.gridData = [
//           [273, 226, 240, 277, 317, 331, 444, 474, 373, 363, 345, 406],
//           [253, 269, 285, 300, 316, 347, 362, 378, 394, 409, 409, 425]
//         ];
//         $scope.gridColors = [{
//             borderColor: "rgb(18, 171, 235)",
//           },
//
//
//         ];
//         $scope.onClick = function(points, evt) {
//           console.log(points, evt);
//         };
//         $scope.gridDataSetOverride = [{
//           yAxisID: 'y-axis-1'
//         }, {
//           yAxisID: 'y-axis-2'
//         }];
//         $scope.gridOptions = {
//           scales: {
//             yAxes: [{
//                 id: 'y-axis-1',
//                 type: 'linear',
//                 display: true,
//                 position: 'left'
//               },
//               {
//                 id: 'y-axis-2',
//                 type: 'linear',
//                 display: true,
//                 position: 'right',
//
//               }
//             ]
//           }
//         };
//
//
//
//
//         //Intrusions
//         $scope.intrusionsLabels = ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016'];;
//         $scope.intrusionsSeries = ['ProductID'];
//         $scope.intrusionColors = [{
//           borderColor: "rgb(18, 171, 235)",
//         }];
//         $scope.intrusionsData = [
//           [27, 22, 24, 17, 31, 33, 44, 47, 37, 36, 34, 40],
//         ];
//         $scope.onClick = function(points, evt) {
//           console.log(points, evt);
//         };
//         $scope.intrusionsDataSetOverride = [{
//           yAxisID: 'y-axis-1'
//         }];
//         $scope.intrusionsOptions = {
//           scales: {
//             yAxes: [{
//               id: 'y-axis-1',
//               type: 'linear',
//               display: true,
//               position: 'left'
//             }]
//           }
//         };
//
//       //Revenue
//         // $scope.revenueLabels = ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016'];;
//         // $scope.revenueSeries = ['Amount(€)k'];
//         // $scope.colors = [{
//         //   borderColor: "rgb(18, 171, 235)",
//         // }];
//         // $scope.revenueData = [
//         //   [33, 31, 28, 33, 39, 40, 54, 61, 42, 44, 39, 48],
//         // ];
//         // $scope.onClick = function(points, evt) {
//         //   console.log(points, evt);
//         // };
//         // $scope.revenueDatasetOverride = [{
//         //   yAxisID: 'y-axis-1'
//         // }];
//         // $scope.revenueOptions = {
//         //   axes: false,
//         //   grid: false
//         // }
//         // $scope.revenueOptions = {
//         //   scales: {
//         //     xAxes: [{
//         //       display: false
//         //     }],
//         //     yAxes: [{
//         //       id: 'y-axis-1',
//         //       type: 'linear',
//         //       display: false,
//         //       position: 'left'
//         //     }]
//         //   }
//         // };
//       })
//
//
//
//
//
//         .controller("BarCtrl", function($scope) {
//
//           // Fire
//           $scope.labels = ['Adelaide', 'Boston', 'Chicago', 'Melbourne', 'Newyork'];
//           $scope.fireSeries = ['ProductID'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.data = [
//             [15, 1, 2, 1, 13]
//           ];
//           $scope.options = {
//             scales: {
//               yAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'ProductID'
//                 }
//               }]
//             }
//           };
//
//           //Fuel
//           $scope.FuelLabels = ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016'];
//           $scope.fuelSeries = ['CustomerID'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.FuelData = [
//             [284, 229, 235, 287, 311, 287, 311, 287, 311, 287, 311, 287]
//           ];
//           $scope.FuelOptions = {
//             scales: {
//               yAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   //labelString: 'CustomerID'
//                 }
//               }]
//             }
//           };
//
//           //Battery
//           $scope.BatteryLabels = ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016'];
//           $scope.batterySeries = ['CustomerID'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.BatteryData = [
//             [25, 26, 29, 30, 31, 40, 35, 27, 45, 21, 35, 40]
//           ];
//           $scope.BatteryOptions = {
//             scales: {
//               yAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'CustomerID'
//                 }
//               }]
//             }
//           };
//
//           //Alarms
//           $scope.alarmsLabels = ['1000-Watt iPod', 'Sound bar -600', 'Flat 55" 1080', 'Credit Card Reader', 'Console 500GB', 'Headset Comfort', 'Jul 2016', 'Dual Shock Controller', 'Flat 55" 1080P', 'Laptop 17.3`` 17', 'Laptop 17.3`` 17', '1000 Watt 3D Blue Ray'];
//           $scope.alarmSeries = ['Product_Margin'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.alarmsData = [
//             [0.35, 0.32, 0.31, 0.30, 0.29, 0.29, 0.28, 0.28, 0.28, 0.28, 0.28, 0.27]
//           ];
//           $scope.alarmsOptions = {
//             scales: {
//               xAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'Product_Margin'
//                 }
//               }]
//             }
//           };
//
//           //Alerts
//           $scope.alertsLabels = ['1000-Watt iPod', 'Sound bar -600', 'Flat 55" 1080', 'Credit Card Reader', 'Console 500GB', 'Headset Comfort', 'Jul 2016', 'Dual Shock Controller', 'Flat 55" 1080P', 'Laptop 17.3`` 17', 'Laptop 17.3`` 17', '1000 Watt 3D Blue Ray'];
//           $scope.alertSeries = ['Product_Margin'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.alertsData = [
//             [0.35, 0.32, 0.31, 0.30, 0.29, 0.29, 0.28, 0.28, 0.28, 0.28, 0.28, 0.27]
//           ];
//           $scope.alertsOptions = {
//             scales: {
//               xAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'Product_Margin'
//                 }
//               }]
//             }
//           };
//           //Top Products data
//           $scope.topProductsLabels = ['Blu-ray Player BP525', '3D Glasses Really Really', 'Laptop A6 440M', '1100-Watt Home Theater', 'Flat 55" 1080p 240Hz'];
//           $scope.topProductsSeries = ['OrderID'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.topProductsData = [
//             [119, 117, 105, 104, 100]
//           ];
//           $scope.topProductsOptions = {
//             scales: {
//               xAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'OrderID'
//                 }
//               }]
//             }
//           };
//
//           //Top Customers data
//           $scope.topCustomersLabels = ['793', '683', '336', '481', '215'];
//           $scope.topCustomersSeries = ['Amount(k)'];
//           $scope.colors = [{
//             backgroundColor: "rgb(18, 171, 235)",
//             hoverBackgroundColor: "rgb(18, 171, 235)",
//             hoverBorderColor: "rgb(18, 171, 235)"
//           }];
//
//           $scope.topCustomersData = [
//             [169, 160, 154, 154, 152]
//           ];
//           $scope.topCustomersOptions = {
//             scales: {
//               xAxes: [{
//                 scaleLabel: {
//                   display: true,
//                   labelString: 'Amount'
//                 }
//               }]
//             }
//           };
//         })


  /**
   * Controller to delete asset information
   */
  .controller('DeleteAssetCtrl', function($scope, $rootScope, $translate, Session, toastNotifier, persistData, logReport, assetInfo, dashboardService, vm, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.assetNameToDelete = assetInfo.name;

    // $scope.progressCount = 0;
    // $scope.progressInfo = {
    //   tatle: (($translate.instant('INFO.PRICE_PROGRESS_STRING')).replace("@@@@", $scope.vMLength)).replace("@@", $scope.progressCount),
    //   data: [{
    //     totalWidth: 100,
    //     width: 0,
    //     colorClass: "bg-cyan",
    //     text: ""
    //   }]
    // };

    // $scope.progressBarPopup = function() {
    //   $scope.cancel();
    //   $scope.progressCount = 0;
    //   $scope.progressInfo.title = (($translate.instant('INFO.PRICE_PROGRESS_STRING')).replace("@@@@", $scope.vMLength)).replace("@@", $scope.progressCount);
    //   $rootScope.progressBar($scope);
    //   $scope.updateServer();
    // };


    function deleteAssets() {
      //var recordExists = "";
      dashboardService.deleteAsset({
        userToken: Session.token,
        assetId: assetInfo.asset_id
      }).
      then(function(result) {
          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('ASSET.ERROR.DELETION_FAIL')
          };
          var validData = persistData.validifyData(result, customInfo);
          logReport.info("Asset Deletion" + JSON.stringify(validData));
          var recordExists = validData.data.recordsExists;
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
          if (recordExists === 0) {
            toastNotifier.showSuccess($translate.instant('ASSET.SUCCESS.DELETION_SUCCESS'));
            vm.dtInstance.reloadData(null, false);
            $rootScope.modalInstance.close();
          } else {
            deleteAssets();
          }
        },
        function(error) {
          logReport.error("Delete Asset Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    }
    $scope.deleteAsset = function() {
      deleteAssets();
    };
  })

  /**
   * Controller to display charts in dashboard
   */

  .controller('ChartsCtrl', function($scope, $rootScope, $translate, CONFIG_DATA, AUTH_EVENTS, USER_ROLES, Session, dashboardService, toastNotifier, persistData, logReport) {

    var tenantIdSelected = "";
    if (Session.tenantType !== USER_ROLES.tenant) {
      tenantIdSelected = 'all';
    } else {
      tenantIdSelected = Session.tenantId;
    }

    var columnData = [{
        id: "t",
        label: "Topping",
        type: "string"
      },
      {
        id: "s",
        label: "Slices",
        type: "number"
      }
    ];
    $scope.getAlertStatus = function() {

      $scope.alertStatus = {
        type: "PieChart",
        options: {
          colors: [],
          is3D: true,
          width: '100%',
          height: 300,
          chartArea: {
            height: "70%",
            width: "100%"
          }
        },
        data: {
          cols: [{
              id: "t",
              label: "Topping",
              type: "string"
            },
            {
              id: "s",
              label: "Slices",
              type: "number"
            }
          ]
        }
      };

      dashboardService.getStatus({
        userToken: Session.token,
        filter: []
      }, tenantIdSelected).then(function(result) {
          logReport.info("Alert Status", JSON.stringify(result));

          var response = result.status;
          var data = result.data.data.status;
          var alertDetails = [];
          if (response === 200) {
            $scope.alertStatus.options.colors = [];
            angular.forEach(data, function(alertsStatus) {
              var alertStatus = {
                c: [{
                  v: alertsStatus.status
                }, {
                  v: alertsStatus.statusCount
                }]
              }

              if (alertsStatus.status.toUpperCase() === "OK") {
                $scope.alertStatus.options.colors.push('#5cb860');
              } else if (alertsStatus.status.toUpperCase() === "ERROR") {
                $scope.alertStatus.options.colors.push('#d9534f');
              } else if (alertsStatus.status.toUpperCase() === "WARNING") {
                $scope.alertStatus.options.colors.push('#f0ad4e');
              }
              alertDetails.push(alertStatus);
            });

            logReport.info("@@@@@Alert" + JSON.stringify(alertDetails));
            $scope.dataset = alertDetails;
            $scope.alertStatus.data = {
              cols: columnData,
              rows: alertDetails
            };
          } else if (response === 403) {
            $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout);
          } else if (response === 500) {
            logReport.error(data);
            toastNotifier.showError($translate.instant('DASHBOARD.ERROR.STATUS_CHART'));
          }
        },
        function(error) {
          logReport.error(JSON.stringify(error));
          toastNotifier.showError($translate.instant('DASHBOARD.TITLE.STATUS_CHART') + ': ' + $translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };

    /*
        Chart For displaying issue types
    */

    $scope.getIssueTypes = function() {
      $scope.issueTypes = {
        type: "PieChart",
        options: {
          is3D: true,
          width: '100%',
          height: 300,
          chartArea: {
            height: "70%",
            width: "100%"
          }
        },
        data: {
          cols: [{
              id: "t",
              label: "Topping",
              type: "string"
            },
            {
              id: "s",
              label: "Slices",
              type: "number"
            }
          ]
        }
      };

      dashboardService.getIssueTypes({
        userToken: Session.token
      }, tenantIdSelected).
      then(function(result) {
          logReport.info("Issues data: " + JSON.stringify(result));
          var response = result.status;
          var data = result.data.data.issues;
          logReport.info(JSON.stringify(data))
          var details = [];
          if (response === 200) {

            angular.forEach(data, function(issueTypes) {
              var issues = {
                c: [{
                  v: issueTypes.sensorType
                }, {
                  v: issueTypes.issuesCount
                }]
              }
              details.push(issues);
            });

            logReport.info(JSON.stringify(details))
            $scope.issueTypes.data = {
              cols: columnData,
              rows: details
            };
          } else if (response === 403) {
            $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout);
          } else if (response === 500) {
            logReport.error(data);
            toastNotifier.showError($translate.instant('DASHBOARD.ERROR.ISSUES_CHART'));
          }
        },
        function(error) {
          logReport.error(JSON.stringify(error));
          toastNotifier.showError($translate.instant('DASHBOARD.TITLE.ISSUES_CHART') + ': ' + $translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  });
