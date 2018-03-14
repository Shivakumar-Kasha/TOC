/**
 * @Date:   01-27-2017 12:01:98
 * @Project: AssetMonitoring
 * @Last modified time: 2017-10-10T15:23:05+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Router for application
 */
app
  .config(['$stateProvider', '$urlRouterProvider', 'USER_ROLES', function($stateProvider, $urlRouterProvider, USER_ROLES) {

    $urlRouterProvider.otherwise('/core/login');

    $stateProvider.state('app', {
        abstract: true,
        url: '/app',
        templateUrl: 'views/app.html'
      })

      //dashboard
      .state('app.dashboard', {
        url: '/dashboard',
        controller: 'DashboardCtrl as showCase',
        templateUrl: 'components/dashboard/dashboard.view.html',
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        },
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/slider/bootstrap-slider.js',
              'shared/vendor/flot/jquery.flot.pie.js',
              'components/dashboard/dashboard.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        }
      })

      //asset-info
      .state('app.asset-info', {
        url: '/asset-info',
        controller: 'AssetInfoCtrl as assetInfo',
        templateUrl: 'components/asset-info/asset-info.view.html',
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        },
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'components/asset-info/asset-info.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        }
      })

      //towerList
      .state('app.towerinfo', {
        url: '/tower-info',
        controller: 'TowerInfoCtrl as showCase',
        templateUrl: 'components/towerList/towerlist.view.html',
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        },
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'components/towerList/towerlist.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        }
      })
    //Alarms
    .state('app.alarms', {
      url: '/alarms',
      controller: 'AlarmsCtrl as alarmInfo',
      templateUrl: 'components/alarms/alarms.view.html',
      data: {
        authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
      },
      resolve: {
        plugins: ['$ocLazyLoad', function($ocLazyLoad) {
          return $ocLazyLoad.load([
            'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
            'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
            'shared/vendor/datatables/Responsive/dataTables.responsive.css',
            'shared/vendor/datatables/Responsive/dataTables.responsive.js',
            'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
            'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
            'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
            'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
            'shared/vendor/datatables/datatables.bootstrap.min.css',
            'shared/vendor/slider/bootstrap-slider.js',
            'components/alarms/alarms.controller.js',
            'shared/kii/KiiSDK.js',
            'shared/kii/KiiSDK.min.js'
          ]);
        }]
      }
    })

      //Alerts
      .state('app.alerts', {
        url: '/alerts',
        controller: 'AlertsCtrl as alertInfo',
        templateUrl: 'components/alerts/alerts.view.html',
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        },
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'components/alerts/alerts.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        }
      })

      //zones
      .state('app.zones', {
        url: '/zones',
        controller: 'ZonesCtrl as zonesInfo',
        templateUrl: 'components/zones/zones.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'components/zones/zones.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant]
        }
      })

      //zone-info
      .state('app.zone-info', {
        url: '/zone-info',
        controller: 'ZoneInfoCtrl',
        templateUrl: 'components/zone-info/zone-info.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'components/zone-info/zone-info.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant]
        }
      })

      //rules
      .state('app.advancedrules', {
        url: '/advancedrules',
        controller: 'AdvancedRulesCtrl',
        templateUrl: 'components/rules/advanced-rules/advancedrules.view.html',
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant]
        },
        resolve: {
          lazy: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'assetManagementApp',
              files: ['components/rules/advanced-rules/advancedrules.controller.js']
            }]);
          }]
        }
      })

      //analytics
      .state('app.analytics', {
        url: '/analytics',
        controller: 'AnalyticsCtrl as showCase',
        templateUrl: 'components/analytics/analytics.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/flot/jquery.flot.resize.js',
              'shared/vendor/flot/jquery.flot.orderBars.js',
              'shared/vendor/flot/jquery.flot.stack.js',
              'shared/vendor/flot/jquery.flot.pie.js',
              'shared/vendor/gaugejs/gauge.min.js',
              'components/analytics/analytics.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })


      //sensor
      .state('app.sensor', {
        url: '/sensor',
        controller: 'SensorCtrl as sensorInfo',
        templateUrl: 'components/sensor/sensor.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/sensor/sensor.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //tickets
            .state('app.tickets', {
              url: '/tickets',
              controller: 'TicketsCtrl as ticketsInfo',
              templateUrl: 'components/tickets/tickets.view.html',
              resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                  return $ocLazyLoad.load([
                    'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
                    'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
                    'shared/vendor/datatables/Responsive/dataTables.responsive.css',
                    'shared/vendor/datatables/Responsive/dataTables.responsive.js',
                    'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
                    'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
                    'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
                    'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
                    'shared/vendor/datatables/datatables.bootstrap.min.css',
                    'shared/vendor/filestyle/bootstrap-filestyle.min.js',
                    'components/tickets/tickets.controller.js',
                    'shared/kii/KiiSDK.js',
                    'shared/kii/KiiSDK.min.js'
                  ]);
                }]
              },
              data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
              }
            })
//topAlarmsAndAlerts

      .state('app.topAlertsAndAlarms', {
        url: '/topAlertsAndAlarms',
        controller: 'AlertsAlarmsCtrl as alertsAndAlarmsinfo',
        templateUrl: 'components/alertAndAlarmsCount/alertsAndAlarmsCount.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/alertAndAlarmsCount/alertsAndAlarmsCount.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })
//Power Consumption LIST

.state('app.powerConsumptionList', {
  url: '/powerConsumptionList',
  controller: 'PowerConsumptionCtrl as powerConsumptionInfo',
  templateUrl: 'components/powerConsumptionList/powerconsumption.view.html',
  resolve: {
    plugins: ['$ocLazyLoad', function($ocLazyLoad) {
      return $ocLazyLoad.load([
        'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
        'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
        'shared/vendor/datatables/Responsive/dataTables.responsive.css',
        'shared/vendor/datatables/Responsive/dataTables.responsive.js',
        'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
        'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
        'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
        'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
        'shared/vendor/datatables/datatables.bootstrap.min.css',
        'shared/vendor/filestyle/bootstrap-filestyle.min.js',
        'components/powerConsumptionList/powerconsumption.controller.js',
        'shared/kii/KiiSDK.js',
        'shared/kii/KiiSDK.min.js'
      ]);
    }]
  },
  data: {
    authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
  }
})

//Grid Power VS DG Power

.state('app.gridPowerVsGpPower', {
  url: '/gridPowerVsGpPower',
  controller: 'GridPowerVsGpPowerCtrl as gridPowerVsGpPowerInfo',
  templateUrl: 'components/gridPowerVsGpPower/gridPowerVsGpPower.view.html',
  resolve: {
    plugins: ['$ocLazyLoad', function($ocLazyLoad) {
      return $ocLazyLoad.load([
        'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
        'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
        'shared/vendor/datatables/Responsive/dataTables.responsive.css',
        'shared/vendor/datatables/Responsive/dataTables.responsive.js',
        'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
        'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
        'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
        'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
        'shared/vendor/datatables/datatables.bootstrap.min.css',
        'shared/vendor/filestyle/bootstrap-filestyle.min.js',
        'components/gridPowerVsGpPower/gridPowerVsGpPower.controller.js',
        'shared/kii/KiiSDK.js',
        'shared/kii/KiiSDK.min.js'
      ]);
    }]
  },
  data: {
    authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
  }
})

//Fuel Consumption


.state('app.fuelConsumption', {
  url: '/fuelConsumption',
  controller: 'FuelConsumptionCtrl as fuelConsumptionInfo',
  templateUrl: 'components/fuelConsumption/fuelConsumption.view.html',
  resolve: {
    plugins: ['$ocLazyLoad', function($ocLazyLoad) {
      return $ocLazyLoad.load([
        'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
        'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
        'shared/vendor/datatables/Responsive/dataTables.responsive.css',
        'shared/vendor/datatables/Responsive/dataTables.responsive.js',
        'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
        'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
        'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
        'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
        'shared/vendor/datatables/datatables.bootstrap.min.css',
        'shared/vendor/filestyle/bootstrap-filestyle.min.js',
        'components/fuelConsumption/fuelConsumption.controller.js',
        'shared/kii/KiiSDK.js',
        'shared/kii/KiiSDK.min.js'
      ]);
    }]
  },
  data: {
    authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
  }
})

//Overall HEALTH
.state('app.overallHealth', {
  url: '/overallHealth',
  controller: 'OverallHealthCtrl as overallHealthInfo',
  templateUrl: 'components/overallHealth/overallHealth.view.html',
  resolve: {
    plugins: ['$ocLazyLoad', function($ocLazyLoad) {
      return $ocLazyLoad.load([
        'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
        'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
        'shared/vendor/datatables/Responsive/dataTables.responsive.css',
        'shared/vendor/datatables/Responsive/dataTables.responsive.js',
        'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
        'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
        'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
        'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
        'shared/vendor/datatables/datatables.bootstrap.min.css',
        'shared/vendor/filestyle/bootstrap-filestyle.min.js',
        'components/overallHealth/overallHealth.controller.js',
        'shared/kii/KiiSDK.js',
        'shared/kii/KiiSDK.min.js'
      ]);
    }]
  },
  data: {
    authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
  }
})

      //Asset Types

      .state('app.asset-types', {
        url: '/asset-type',
        controller: 'AssetTypesCtrl as assetTypes',
        templateUrl: 'components/asset-types/asset-types.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/asset-types/asset-types.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //models
      .state('app.models', {
        url: '/models',
        controller: 'ModelsCtrl as modelsInfo',
        templateUrl: 'components/models/models.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/models/models.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //devices
      .state('app.devices', {
        url: '/devices',
        controller: 'DevicesCtrl as devicesInfo',
        templateUrl: 'components/devices/devices.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/devices/devices.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })
      //model-info
      .state('app.model-info', {
        url: '/model-info',
        controller: 'ModelInfoCtrl as modelInfo',
        templateUrl: 'components/model-info/model-info.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/model-info/model-info.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //device-info
      .state('app.device-info', {
        url: '/device-info',
        controller: 'DeviceInfoCtrl',
        templateUrl: 'components/device-info/device-info.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/device-info/device-info.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //tenant users
      .state('app.tenant-users', {
        url: '/tenant-users',
        controller: 'TenantUsersCtrl as tenantUsersInfo',
        templateUrl: 'components/tenant-users/tenant-users.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/tenant-users/tenant-users.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant]
        }
      })

      //settings
      .state('app.settings', {
        url: '/settings',
        templateUrl: 'components/settings/settings.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/settings/settings.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.tenant, USER_ROLES.master]
        }
      })

      //tenants
      .state('app.tenants', {
        url: '/tenants',
        controller: 'TenantsCtrl as showCaseTenants',
        templateUrl: 'components/tenants/tenants.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/tenants/tenants.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.master]
        }
      })

      //users
      .state('app.users', {
        url: '/users',
        controller: 'UsersCtrl as usersInfo',
        templateUrl: 'components/users/users.view.html',
        resolve: {
          plugins: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([
              'shared/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
              'shared/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
              'shared/vendor/datatables/Responsive/dataTables.responsive.css',
              'shared/vendor/datatables/Responsive/dataTables.responsive.js',
              'shared/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
              'shared/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
              'shared/vendor/datatables/TableTools/css/dataTables.tableTools.css',
              'shared/vendor/datatables/TableTools/js/dataTables.tableTools.js',
              'shared/vendor/datatables/datatables.bootstrap.min.css',
              'shared/vendor/filestyle/bootstrap-filestyle.min.js',
              'components/users/users.controller.js',
              'shared/kii/KiiSDK.js',
              'shared/kii/KiiSDK.min.js'
            ]);
          }]
        },
        data: {
          authorizedRoles: [USER_ROLES.operator, USER_ROLES.master]
        }
      })

      //app core pages(login, forgotpass)
      .state('core', {
        abstract: true,
        url: '/core',
        template: '<div ui-view></div>'
      })

      //login
      .state('core.login', {
        url: '/login',
        controller: 'LoginCtrl',
        templateUrl: 'components/login/login.view.html',
        data: {
          authorizedRoles: [USER_ROLES.all]
        },
        resolve: {
          lazy: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'assetManagementApp',
              files: ['components/login/login.controller.js']
            }]);
          }]
        }
      })

      //forgot password
      .state('core.forgot-pass', {
        url: '/forgot-pass',
        controller: 'ForgotPassCtrl',
        templateUrl: 'components/forgot-pass/forgot-pass.view.html',
        data: {
          authorizedRoles: [USER_ROLES.all]
        },
        resolve: {
          lazy: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'assetManagementApp',
              files: ['components/forgot-pass/forgot-pass.controller.js']
            }]);
          }]
        }
      })

      //reset password
      .state('core.reset', {
        url: '/reset?id&code',
        controller: 'ResetPassCtrl',
        templateUrl: 'components/reset/reset.view.html',
        data: {
          authorizedRoles: [USER_ROLES.all]
        },
        resolve: {
          lazy: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'assetManagementApp',
              files: ['components/reset/reset.controller.js']
            }]);
          }]
        }
      });

  }]);
