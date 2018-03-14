/**
 * @Date:   01-27-2017 12:01:28
 * @Project: AssetMonitoring
 * @Last modified time: 12-05-2017 14:05:58
 * @Copyright: 2017, Kii Corporation www.kii.com
 */


'use strict';
/**
 * Main module of the application
 */

var app = angular
  .module('assetManagementApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'ngMessages',
    'picardy.fontawesome',
    'ui.bootstrap',
    'ui.router',
    'ui.utils',
    'angular-momentjs',
    'FBAngular',
    'toastr',
    'angularBootstrapNavTree',
    'oc.lazyLoad',
    'ui.select',
    'ui.tree',
    'textAngular',
    'colorpicker.module',
    'angularFileUpload',
    'ngImgCrop',
    'datatables',
    'datatables.bootstrap',
    'datatables.colreorder',
    'datatables.colvis',
    'datatables.tabletools',
    'datatables.scroller',
    'datatables.columnfilter',
    'ui.grid',
    'ui.grid.resizeColumns',
    'ui.grid.edit',
    'ui.grid.moveColumns',
    'ngTable',
    'angular-flot',
    'easypiechart',
    'uiGmapgoogle-maps',
    'ui.calendar',
    'ngTagsInput',
    'pascalprecht.translate',
    'ngMaterial',
    'localytics.directives',
    'wu.masonry',
    'ipsum',
    'angular-intro',
    'dragularModule',
    'base64',
    //'ngIntlTelInput',
    'googlechart',
    'rt.asyncseries',
    'betsol.intlTelInput',
    'chart.js',
    'datamaps'
  ])

  .constant('USER_ROLES', {
    all: '*',
    operator: 'Admin',
    technician: 'Technician',
    observer: 'Observer',
    tenant: 'Tenant',
    master: 'Master'
  })

  .constant('REG_EXP', {
    email: /^([a-zA-Z0-9._%+-])+@([a-zA-Z0-9.-])+\.(([a-zA-Z]){2,3})$/,
    domain: /^([a-zA-Z0-9.-])+\.(([a-zA-Z]){2,3})$/,
    username: /^([a-zA-Z0-9._%+-])+$/,
    label: /@"^[a-zA-Z0-9\s]+$"/

  })

  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized',
    updatedPassword: 'updated-password'
  })

  .config(function(uiGmapGoogleMapApiProvider, CONFIG_DATA) {
    uiGmapGoogleMapApiProvider.configure({
      key: CONFIG_DATA.MAP_API_KEY,
      v: '3.28',
      libraries: 'weather,geometry,visualization,places,drawing',
      sensor: false,
      language: 'en'
    });
  })

  .config(function(intlTelInputOptions) {
    angular.extend(intlTelInputOptions, {
      nationalMode: false,
      defaultCountry: 'auto',
      preferredCountries: ['us'],
      autoFormat: true,
      autoPlaceholder: true
    });
  })

  // .config(function(ngIntlTelInputProvider) {
  //   ngIntlTelInputProvider.set({
  //     initialCountry: 'us',
  //     utilsScript: 'bower_components/intl-tel-input/build/js/utils.js'
  //   });
  // })

  .run(['$rootScope', '$state', '$translate', '$window', '$stateParams', 'AUTH_EVENTS', 'loginService', 'alertNotifier', 'toastNotifier', 'toastr', function($rootScope, $state, $translate, $window, $stateParams, AUTH_EVENTS, loginService, alertNotifier, toastNotifier, toastr) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    loginService.init();
    $rootScope.$on('$stateChangeStart', function(event, next) {
      alertNotifier.clearAlerts();
      if (next.name !== 'core.login' && next.name !== 'core.forgot-pass' && next.name !== 'core.reset') {
        var authorizedRoles = next.data.authorizedRoles;
        if (!loginService.isAuthorized(authorizedRoles)) {
          event.preventDefault();
          if (loginService.isAuthenticated()) {
            // user is not allowed
            $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
          } else {
            // user is not logged in
            $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            $state.go('core.login');
          }
        }
      }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState) {
      event.targetScope.$watch('$viewContentLoaded', function() {
        angular.element('html, body, #content').animate({
          scrollTop: 0
        }, 200);
        setTimeout(function() {
          angular.element('#wrap').css('visibility', 'visible');
          if (!angular.element('.dropdown').hasClass('open')) {
            angular.element('.dropdown').find('>ul').slideUp();
          }
        }, 200);
      });
      $rootScope.containerClass = toState.containerClass;
    });

    $rootScope.online = navigator.onLine;
    $window.addEventListener("offline", function() {
      toastr.clear();
      toastNotifier.showError($translate.instant('Menu.OFFLINE'));
    }, false);
    $window.addEventListener("online", function() {
      toastr.clear();
      toastNotifier.showSuccess($translate.instant('Menu.ONLINE'));
      // $window.location.reload();
    }, false);

  }])

  .config(['uiSelectConfig', function(uiSelectConfig) {
    uiSelectConfig.theme = 'bootstrap';
  }])

  .config(function($httpProvider) {
    $httpProvider.useApplyAsync(true);
    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })

  //angular-language
  .config(['$translateProvider', function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'languages/',
      suffix: '.json'
    });
    $translateProvider.useLocalStorage();
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy(null);
  }])

  //session
  .service('Session', function() {
    this.create = function(token, userName, userMail, userRole, tenantType, tenantId, tenantName, userImage, expiresIn) {
      this.token = token;
      this.userName = userName;
      this.userMail = userMail;
      this.userRole = userRole;
      this.tenantType = tenantType;
      this.tenantId = tenantId;
      this.tenantName = tenantName;
      this.userImage = userImage;
      this.expiresIn = expiresIn;
    };
    this.destroy = function() {
      this.token = null;
      this.userName = null;
      this.userMail = null;
      this.userRole = null;
      this.tenantType = null;
      this.tenantId = null;
      this.tenantName = null;
      this.userImage = null;
      this.expiresIn = null;
    };
    return this;
  })

  // current location
  .factory('currentLocation', function($rootScope, $translate, $q, logReport, alertNotifier) {
    return {
      location: function() {
        var deferred = $q.defer();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var myCurrentLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            deferred.resolve(myCurrentLocation);
          }, function(error) {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                logReport.error("Get Current Location", error.message);
                alertNotifier.showAlert($translate.instant('DASHBOARD.ERROR.CURRENT_LOCATION_PERMISSION_DENIED'), 'danger', null);
                break;

              case error.POSITION_UNAVAILABLE:
                logReport.error("Get Current Location", error.message);
                alertNotifier.showAlert($translate.instant('DASHBOARD.ERROR.CURRENT_LOCATION_NOT_AVAILABLE'), 'danger', null);
                break;

              case error.TIMEOUT:
                logReport.error("Get Current Location", error.message);
                alertNotifier.showAlert($translate.instant('DASHBOARD.ERROR.CURRENT_LOCATION_TIMED_OUT'), 'danger', null);
                break;

              default:
                logReport.error("Get Current Location", "An unknown error occurred.");
                alertNotifier.showAlert($translate.instant('DASHBOARD.ERROR.CURRENT_LOCATION_UNKNOWN_ERROR'), 'danger', null);
                break;
            }
          });
        } else {
          alertNotifier.showAlert('Geolocation is not supported by this browser.', 'danger', null);
        }
        return deferred.promise;
      }
    };
  })

  // geocode
  .factory('GeoCode', function($q, $log, $window) {
    return {
      latLong: function(address) {
        var geocoder = new $window.google.maps.Geocoder();
        var deferred = $q.defer();
        geocoder.geocode({
          'address': address
        }, function(results, status) {
          $log.info(status);
          if (status === $window.google.maps.GeocoderStatus.OK) {
            return deferred.resolve(results);
          }
          return deferred.reject();
        });
        return deferred.promise;
      }
    };
  })

  // reverse geocode
  .factory('ReverseGeoCode', function($q, $window) {
    return {
      address: function(latLong) {
        var geocoder = new $window.google.maps.Geocoder();
        var deferred = $q.defer();
        var latlng = new $window.google.maps.LatLng(latLong.lat, latLong.lng);
        geocoder.geocode({
          'latLng': latlng
        }, function(results, status) {
          if (status === $window.google.maps.GeocoderStatus.OK) {
            return deferred.resolve(results);
          }
          return deferred.reject();
        });
        return deferred.promise;
      }
    };
  })

  // display toaster
  .factory('toastNotifier', function(toastr) {

    toastr.options = {
      position: 'toast-top-right',
      timeout: '5000',
      extendedTimeout: '1000',
      html: false,
      closeButton: true,
      tapToDismiss: true,
      closeHtml: '<i class="fa fa-times"></i>'
    };

    return {
      showSuccess: function(msg) {
        toastr.success(msg);
      },
      showError: function(msg) {
        toastr.error(msg);
      },
      showInfo: function(msg) {
        toastr.info(msg);
      },
      showWarning: function(msg) {
        toastr.warning(msg);
      }
    };
  })

  // display alert
  .factory('alertNotifier', function($timeout) {
    var alertService = {};

    // create an array of alerts
    alertService.alerts = [];

    alertService.showAlert = function(msg, type, timeout) {
      alertService.alerts.pop();
      if (timeout === null) {
        timeout = 10000 * 10000;
      }

      alertService.alerts.push({
        'msg': msg,
        'type': type
      });

      if (timeout) {
        $timeout(function() {
          alertService.closeAlert(this);
        }, timeout);
      }
    };

    alertService.closeAlert = function(index) {
      alertService.alerts.splice(index, 1);
    };

    alertService.clearAlerts = function() {
      //alertService.alerts = [];
      alertService.alerts.pop();
    };

    return alertService;
  })

  // autofill address
  .directive('googleplace', function($window) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, model) {
        var options = {
          types: [],
          componentRestrictions: {}
        };
        scope.gPlace = new $window.google.maps.places.Autocomplete(element[0], options);

        $window.google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
          scope.$apply(function() {
            model.$setViewValue(element.val());
          });
        });
      }
    };
  })

  // current location
  .directive('currentLocation', function($window, logReport) {
    return function(scope, elem) {
      var mapOptions = {
        center: new $window.google.maps.LatLng(-34.397, 150.644),
        zoom: 16,
        mapTypeId: $window.google.maps.MapTypeId.ROADMAP
      };
      var map = new $window.google.maps.Map(elem[0], mapOptions);

      navigator.geolocation.getCurrentPosition(function(pos) {
        map.setCenter(new $window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      }, function(error) {
        logReport.error('Unable to get location', JSON.stringify(error));
      });
    };
  })

  // required
  .directive("required", function() {
    return {
      restrict: 'A', // only for attributes
      compile: function(element) {
        // insert asterisk after elment
        element.find('label').append("<sup class='text-danger'><i class='fa fa-asterisk'></i></sup>");
        element.find('input').attr('required', 'required');
        element.find('select').attr('required', 'required');
      }
    };
  })

  // persist data
  .service('persistData', function($rootScope, $translate, CONFIG_DATA, AUTH_EVENTS, alertNotifier, toastNotifier, utilityFunctions, logReport) {
    var validationFunctions = {
      isValid: function(value) {
        if (value !== "" && value !== null && value !== undefined && value !== "undefined") {
          return true;
        } else {
          return false;
        }
      },
      validifyData: function(result, customInfo) {
        var data = result.data.returnedValue;
        logReport.info("Response", JSON.stringify(data));
        var response = data.status;
        var message = data.message;
        if (response === CONFIG_DATA.SUCCESS) {
          if (validationFunctions.isValid(customInfo.successMessage)) {
            toastNotifier.showSuccess(customInfo.successMessage);
            logReport.info(JSON.stringify($rootScope.modalInstance));
            if (validationFunctions.isValid($rootScope.modalInstance)) {
              $rootScope.modalInstance.close();
            }
          }
          return data;
        } else if (response === CONFIG_DATA.FAIL && message === "Model already exists.") {
          if (validationFunctions.isValid(customInfo.alreadyExists)) {
            toastNotifier.showInfo(customInfo.alreadyExists);
            //logReport.warn(JSON.stringify(data));
          }
          return data;
        } else if (response === CONFIG_DATA.FAIL && (message.indexOf("Device with name"))) {
          if (validationFunctions.isValid(customInfo.alreadyExists)) {
            toastNotifier.showInfo(customInfo.alreadyExists);
            //logReport.warn(JSON.stringify(data));
          }
          return {};
        } else if (response === CONFIG_DATA.FAIL && (message.indexOf("already exists") > 0)) {
          if (validationFunctions.isValid(customInfo.alreadyExists)) {
            alertNotifier.showAlert(customInfo.alreadyExists, 'warning', null);
            logReport.warn(JSON.stringify(data));
          }
          return {};
        } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
          if (validationFunctions.isValid($rootScope.modalInstance)) {
            $rootScope.modalInstance.close();
            alertNotifier.clearAlerts();
          }
          return {};
        } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.IN_VALID_TOKEN) {
          if (validationFunctions.isValid(customInfo.errorMessage)) {
            toastNotifier.showError(customInfo.errorMessage);
          }
          return {};
        }
      }
    };
    return validationFunctions;
  })

  // datatable data filteration
  .service('dataTable', function($rootScope, $compile, $translate, $sanitize, $sce, logReport, CONFIG_DATA, AUTH_EVENTS, utilityFunctions, persistData) {
    return {
      filterData: function(results, draw) {
        logReport.info("Info", results);
        var recordsData = {
          draw: draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: []
        };

        if (results.length !== 0) {
          var recordsArrayData = [];
          var data = JSON.parse(results);
          var response = data.returnedValue.status;
          if (response === CONFIG_DATA.SUCCESS) {
            recordsData['recordsTotal'] = data.returnedValue.data.recordsTotal;
            recordsData['recordsFiltered'] = data.returnedValue.data.recordsTotal;
            angular.forEach(data.returnedValue.data.records, function(record, index) {
              var data = record._customInfo;
              data['modifiedAt'] = record._modified;
              if (persistData.isValid(record.objectURI)) {
                data['objectURI'] = record.objectURI;
              }
              if (persistData.isValid(record._created)) {
                data['_created'] = record._created;
              }
              if (persistData.isValid(record.assetTypeInfo)) {
                data['assetTypeInfo'] = record.assetTypeInfo;
              }
              if (persistData.isValid(record.objectID)) {
                data['objectID'] = record.objectID;
              }
              data['id'] = index;
              angular.forEach(data, function(value, key) {
                if (typeof value !== 'object' && typeof value !== 'Array') {
                  try {
                    //data[key] = $sanitize(value);
                    data[key] = $sanitize((value.toString()).replace(new RegExp("<style>[^]*</style>|<style>[^]*|</style>", 'g'), ''));
                  } catch (error) {
                    logReport.error(error);
                  }
                }
              });
              recordsArrayData.push(data);
            });
            recordsData['data'] = recordsArrayData;
          } else {
            var message = data.returnedValue.message;
            if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
              utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
              if (persistData.isValid($rootScope.modalInstance)) {
                $rootScope.modalInstance.close();
              }
            } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.IN_VALID_TOKEN) {}
          }
        }
        return recordsData;
      },
      rendererRows: function(api, rowIndex) {

        /**
         *
         * Override the default renderer for child's rows.
         *
         * @params {object}: API instance from datatable
         * @params {int}: Contains the row index
         *
         * @type {*|string}
         **/

        var data = api.cells(rowIndex, ':hidden').eq(0).map(renderCell).toArray().join('');

        function renderCell(cell) {

          /**
           *
           * Render the childs columns keeping the events used in
           * @renderWith option.
           *
           * @params {object}: Cell api instance from datatables.
           *
           * @return {string}: The child's row html.
           *
           **/

          var header, _cell, cellData, index, column, columnData, rowObject;

          // gets the header
          header = angular.element(api.column(cell.column).header());

          // gets the target cell from map
          _cell = api.cell(cell);

          // gets the cell's data
          cellData = _cell.data();

          // gets the indexes info
          // @index is an object with row and column index
          index = _cell.index();

          // gets the angular-datable column instance.
          column = _cell.context[0].aoColumns[index.column];

          // gets the object that is filling the table row information
          rowObject = _cell.context[0].aoData[index.row]._aData;

          // checks if the @renderWith is a function
          if (angular.isFunction(column.mRender)) {

            columnData = column.mRender(cellData, null, rowObject);
          } else {

            columnData = cellData;
          }

          // create the new row template
          var template = '<tr>' +
            '    <td><strong>' +
            header.text() + ':' +
            '    </strong>' +
            columnData +
            '    </td>' +
            '</tr>';

          return template;
        }

        return data;
      }
    };
  })


  // print log report in console
  .service('logReport', function($log, CONFIG_DATA) {
    var isEnabled = CONFIG_DATA.PRINT_LOG;
    return {
      info: function(src, msg) {
        if (isEnabled) {
          $log.info(src + ": " + msg);
        }
      },
      error: function(src, msg) {
        if (isEnabled) {
          $log.error(src + ": " + msg);
        }
      },
      warn: function(src, msg) {
        if (isEnabled) {
          $log.warn(src + ": " + msg);
        }
      }
    };
  });


angular.element(document).ready(
  function($http) {
    $http.get('config/config.json').success(function(data, status, headers, config) {
      angular.module('assetManagementApp').constant('CONFIG_DATA', (function() {
        var brandName = data.brandName;
        var appId = data.app.id;
        var appKey = data.app.key;
        var url = data.app.url;
        var deploymentUrl = data.rules.url;
        var rulesServiceUrl = data.rules.repo;
        var rulesPackage = data.rules.package;
        var rulesRepo = data.rules.repo;
        var serviceUrl = data.serviceUrl;
        var kafkaUrl = data.kafkaUrl;
        var googleMapKey = data.googleMapKey;
        var debugEnabled = data.debugEnabled;
        var sessionLastsIn = parseInt(data.sessionLastsIn);
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//maps.googleapis.com/maps/api/js?key=' + googleMapKey + '&libraries=weather,geometry,visualization,places,drawing&language=en&v=3';
        document.body.appendChild(script);
        return {
          BRAND_NAME: brandName,
          APP_ID: appId,
          APP_KEY: appKey,
          URL_PATH: url,
          KII_URL: url + '/apps/' + appId + '/',
          SERVER_URL: url + '/apps/' + appId + '/server-code/versions/current/',
          SERVICES: {
            getDevices: serviceUrl + '/apps/' + appId + '/analytics/list/devicesAndReadings?tenantID=',
            getAssets: serviceUrl + '/apps/' + appId + '/analytics/list/geo/assets?tenantID=',
            getStatus: serviceUrl + '/apps/' + appId + '/dashboard/assets/status?tenantID=',
            getIssues: serviceUrl + '/apps/' + appId + '/dashboard/sensors/issues?tenantID=',
            getSensorIssues: serviceUrl + '/apps/' + appId + '/analytics/sensors/issues?tenantID=',
            getAssetIssues: serviceUrl + '/apps/' + appId + '/analytics/assets/count?tenantID=',
            getOverViewMethod:serviceUrl+ '/apps/'+ appId +'/analytics/overview',
            getTowerListMethod: serviceUrl+ '/apps/' + appId +'/analytics/list/towers',
            getPowerConsumptionCatagoryMethod:  serviceUrl+ '/apps/' +appId+ '/analytics/powerConsumptionByCatagory',
            getGpPowerVsDgPowerMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getGpPowerVsDgPower',
            getTopAlarmsMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getTopAlarms',
            getTopAlertsMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getTopAlerts',
            getAlarmTrendsMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getAlarmTrends',
            getFireAndSmokeTrendsMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getFireAndSmokeTrends',
            getIntrusionsDetectedMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getIntrusionsDetected',
            getVoltageDCAlarmsMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getVoltageDCAlarms',
              getAlarms: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/sensors/{sensorType}/getAlarms',
              getAlertsOrAlarmsWithCount: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/getAlertsOrAlarmsWithCount?fetch={fetchBy}',
              getTickets: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/getTickets?ticketStatus={ticketStatus}&&statusFilterType={statusFilterType}',
              getPowerConsumptinList: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/getPowerConsumptinList',
              getGpPowerVsDgPower: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/getGpPowerVsDgPower',
              getDgFuelConsumptionMethod: serviceUrl+ '/apps/' +appId+ '/analytics/getDgFuelConsumption',
              getFuelConsumptinList: serviceUrl+ '/apps/' +appId+ '/analytics/customers/{tenantID}/towers/{towerID}/getFuelConsumptinList'
            //  getOverallHealthMethod: serviceUrl + '/apps/' + appId + '/analytics/list/geo/assets'

              //getTickets: serviceUrl+ '/apps/' +appId+ '/analytics/customers/all/towers/all/getTickets?ticketStatus=open&fromDate=2018-01-05&toDate=2018-01-05'



            //getWarehouses: 'http://192.168.1.146:8080/csm/app/csm/apps/' + appId + '/analytics/list/geo/warehouses?tenantID='
          },
          //  KAFKA_URL: deploymentUrl + '/' + kafkaUrl + '/app/vendwise/apps/' + appId + '/analytics/models/{modelId}/',
          //KAFKA_SALES_URL: deploymentUrl + '/' + kafkaUrl + '/app/vendwise/apps/' + appId + '/analytics/models/{modelId}/bestSellersInDateRange/{sellerType}',
          HEADERS: {
            'Authorization': 'Basic ' + angular.injector(['base64']).get('$base64').encode(appId + ':' + appKey),
            'Content-Type': 'application/json',
            'X-XSS-Protection': 1,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'Access-Control-Allow-Origin': '*'
          },
          BROADCAST_URL: '//run-east.att.io/1571ab3609bb9/72a1b573448b/9ac64a0409d2f90/in/flow/sendMessage',
          ANDROID_APK: '//dl.testfairy.com/download/6GW3JD1S6MTJTD1P74TK4E9P6GPTYW47KV9XP6G0S22SMRM4GV8AQE6MJ2T0/GeneratorDemov1.0.1-testfairy.apk',
          MAP_API_KEY: googleMapKey,
          SESSION_LASTS_IN: sessionLastsIn,
          SUCCESS: true,
          API_UNAUTHORIZED_USER: 'UNAUTHORIZED_USER',
          UN_AUTHORIZED_USER: 'WRONG_TOKEN: The provided token is not valid',
          IN_VALID_TOKEN: 'WRONG_TOKEN: The provided token is not valid',
          WRONG_PASSWORD: 'WRONG_PASSWORD: The provided password is wrong',
          LINK_EXPIRED: 'LINK_EXPIRED: Your password reset link has expired.',
          FORBIDDEN_ACCESS: 'Access to this resource is forbidden.',
          FAIL: false,
          SERVER_RESPONSE: {
            WRONG_TOKEN: "WRONG_TOKEN",
            SUCCESS_CODE: 200,
            FAIL_CODE: 403,
            TENANT_CEATED_SUCCESS: "SUCCESS"
          },
          'STATUS': {
            green: 'GREEN',
            yellow: 'YELLOW',
            red: 'RED',
            ok: 'OK',
            orange: 'ORANGE',
            warning: 'WARNING',
            error: 'CRITICAL'

          },
          ASSET_TYPE: {},

          SENSORS: {
            movement: 'Movement',
            fuel: 'Fuel',
            temperature: 'Temperature',
            level: "Tank Level",
            flowrate: "Flow Rate"
          },

          SENSOR_TYPES: [{
            option: 'Tank Level',
            view: 'Tank Level'
          }, {
            option: 'Temperature',
            view: 'Temperature'
          }, {
            option: 'Fuel',
            view: 'Fuel'
          }, {
            option: 'Movement',
            view: 'Movement'

          }, {
            option: 'Humidity',
            view: 'Humidity'

          }, {
            option: 'Flow Rate',
            view: 'Flow Rate'

          }, {
            option: 'Other',
            view: 'Other Type'
          }],


          LOGIN: {
            method: 'login'
          },
          FORGOT_PASSWORD: {
            method: 'forgotPassword'
          },
          RESET_PASSWORD: {
            method: 'resetPassword'
          },
          VALIDATION: {
            validateToken: 'authenticateUserWithToken'
          },
          USERS: {
            getMethod: 'getUsers',
            postMethod: 'addUser',
            closeTicket: 'closeTicket',
            putMethod: 'updateUserAdvanced',
            advanceUpdateMethod: 'updateUserAdvanced',
            deleteMethod: 'deleteUser',
            tenantUserRoles: [{
              option: 'Admin',
              view: 'Admin'
            }, {
              option: 'Observer',
              view: 'Observer'
            }, {
              option: 'User',
              view: 'User'
            }, {
              option: 'Technician',
              view: 'Technician'
            }]
          },
          TENANTS: {
            postMethod: 'addTenant',
            getMethod: 'getTenants',
            putMethod: 'updateTenant',
            deleteMethod: 'deleteTenant',
            tenantDetails: 'getTenantDetails',
            SUCCESS: 'Success'
          },
          DASHBOARD: {
            OPTIONS: [{
              option: 'All',
              view: 'All'
            }, {
              option: 'OK',
              view: 'OK'
            }, {
              option: 'Warning',
              view: 'Warning'
            }, {
              option: 'Error',
              view: 'Error'
            }],
            LOCATION_OPTIONS: [{
              option: 'All',
              view: 'All'
            }, {
              option: 'Mall',
              view: 'Shopping Mall'
            }, {
              option: 'Street',
              view: 'Street'

            }, {
              option: 'Stadium',
              view: 'Stadium'

            }],
            CONNECTIVITY_OPTIONS: [{
              option: 'all',
              view: 'All'
            }, {
              option: 'Cellular',
              view: 'Cellular (3G/4G etc.)'
            }, {
              option: 'Internet',
              view: 'Internet (Wi-Fi,Ethernet, etc.)'
            }],
            STATUS_IMAGE_URL: {
              ok: "images/vendor/green.png",
              error: "images/vendor/red.png",
              warning: "images/vendor/orange.png",
              yellow: "images/vendor/yellow.png",
              flowrategreen: "images/vendor/flow-rate-green.png",
              flowratered: "images/vendor/flow-rate-red.png",
              flowrateorange: "images/vendor/flow-rate-orange.png",
              flowrateyellow: "images/vendor/flow-rate-yellow.png",
              movementgreen: "images/vendor/movement-green.png",
              movementred: "images/vendor/movement-red.png",
              temperaturered: "images/vendor/temp-red.png",
              temperaturegreen: "images/vendor/temp-green.png",
              temperatureyellow: "images/vendor/temp-yellow.png",
              location: "images/vendor/location.png"
            },
            getMethod: 'getAssets',
            getSensorReadings: 'getSensorReadings',
            getSensorsByAsset: 'getSensorsByAsset',
            postMethod: 'addUser',
            putMethod: 'updateUser',
            deleteMethod: 'deleteAsset',
            machineCondition: "getMachineConditionData",
            issueTypes: "getIssueTypesData",
            repairIssuesBreakdown: "getRepairIssueBreakDownData",
            refillStatus: "getRefillStatusData"
          },
          REPORTS: {
            getAssets: 'getAssets',
            getAssetsInDueDate: 'getAssetsInDueDate'
          },
          ASSET_INFO: {
            getSensorsInfo: 'getSensors',
            getSensorReadings: 'getSensorReadings',
            updateBaseLocation: 'updateBaseLocation'
          },
          ASSET_TEMPLATES: {
            addAssetTemplate: 'addAssetTemplate',
            deleteAssetTemplate: 'deleteAssetTemplate',
            getAssetTemplates: 'getAssetTemplates',
          },
          ZONES: {
            getMethod: 'getZones',
            postMethod: 'addZone',
            deleteMethod: 'deleteZone',
            putMethod: 'updateZone'
          },
          ZONE_INFO: {
            USERS: {
              assignMethod: 'assignUserToZone',
              unassignMethod: 'unassignUserFromZone'
            },
            ASSETS: {
              assignMethod: 'assignAssetToZone',
              unassignMethod: 'unAssignAssetFromZone'
            }
          },
          ALERTS: {
            OPTIONS: [{
              option: 'all',
              view: 'All'
            }, {
              option: 'assetName',
              view: 'Asset Name'
            }, {
              option: 'address',
              view: 'Location'
            }, {
              option: 'sensorType',
              view: 'Sensor Type'
            }, {
              option: 'alert',
              view: 'Alert'
            }],
            getMethod: 'getAlerts'
          },
          CATALOG: {
            postMethod: 'addProduct',
            getMethod: 'getProducts',
            putMethod: 'updateProduct',
            deleteMethod: 'deleteProduct',
            cloneCatalog: 'addProductsFromMaster',
          },
          SENSOR: {
            postMethod: 'addSensor',
            getMethod: 'getSensors',
            putMethod: 'updateSensor',
            deleteMethod: 'deleteSensor',
            cloneSensor: 'addSensorsFromMaster',
            deleteSensorFromModel: 'deleteSensorFromModel',
            getSensorDetails: 'getSensorDetails'
          },

          ASSET_TYPES: {
            postMethod: 'addAssetType',
            getMethod: 'getAssetTypes',
            cloneAssetTypes: 'addAssetTypesFromMaster',
            deleteMethod: 'deleteAssetType'
          },
          MODELS: {
            postMethod: 'addModel',
            getMethod: 'getModels',
            getModelDetails: 'getModelDetails',
            putMethod: 'updateModel',
            deleteMethod: 'deleteModel',
            addDevicesToModel: 'addDevicesToModel',
            cloneModels: 'addModelsFromMaster'
          },
          DEVICES: {
            postMethod: 'addDeviceModel',
            getMethod: 'getDeviceModels',
            getModelDetails: 'getDeviceDetails',
            putMethod: 'updateDeviceModel',
            deleteMethod: 'deleteDevice',
            addDevicesToModel: 'addSensorsToDevice',
            deleteDeviceFromModel: 'deleteDeviceFromModel',
            cloneModels: 'addDevicesFromMaster'
          },
          TASKS: {
            getMethod: 'getTasks',
            putMethod: 'updateTask'
          },
          SEARCH: {
            "users": {
              searchBy: "s_userMail",
              filterType: "sw"
            },
            "dashboard": {
              searchBy: "name",
              filterType: "sw"
            },
            "vmInfo": {
              searchBy: "s_issueType",
              filterType: "sw"
            },
            "zones": {
              searchBy: "s_name",
              filterType: "sw"
            },
            "catalog": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "sensor": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "models": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "priceGroups": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "tenants": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "tasks": {
              searchBy: 's_taskId',
              filterType: 'sw'
            },
            "assetTypes": {
              searchBy: 's_name',
              filterType: 'sw'
            },
            "alerts": {
              searchBy: 's_assetName',
              filterType: 'sw'
            }

          },
            RULES: {
            DEPLOYED_URL: deploymentUrl,
            UPDATE_CONFIG: '/' + rulesPackage + '/api/rules/updateConfig',
            RULES_URL_PATTERN: '/kie-drools-wb.html?standalone=true&path=default://master@' + rulesRepo + 'Repo/' + rulesRepo + '/src/main/resources/' + rulesPackage + '/' + rulesPackage + '/#####.gdst&file_name=#####.gdst',
            RULES_URL: [{
              option: 'ACEnergyMeterRules',
              view: 'AC Energy Meter Rules'
            }, {
              option: 'BatteryBankRules',
              view: 'Battery Bank Rules'
            }, {
              option: 'CommonDeviceRules',
              view: 'Common Device Rules'

            }, {
              option: 'DCEnergyMeterRules',
              view: 'DC Energy Meter Rules'

            }, {
              option: 'DieselGeneratorRules',
              view: 'Diesel Generator Rules'
            }, {
              option: 'GridPowerRules',
              view: 'Grid Power Rules'
            }],
            DEPLOY_URL: '/rest/repositories/' + rulesRepo + 'Repo/projects/' + rulesRepo + '/maven/install',
            APPROVED: 'APPROVED'

          },

          ANALYTICS: {
            revenue: 'revenue',
            repairs: 'repair',
            refills: 'refill'
          },
          MAX_MODEL_PROPERTIES: 20,
          PRINT_LOG: debugEnabled,
          COPYRIGHT_YEAR: new Date().getFullYear(),
          DATA_TABLE: {
            records: 200
          }
        };
      })());
      angular.bootstrap(document, ['assetManagementApp']);
    });
  }
);
