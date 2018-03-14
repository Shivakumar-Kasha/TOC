/**
 * @Date:   02-25-2016 13:02:00
 * @Project: 24/7PizzaBOX
 * @Last modified time: 2017-10-11T19:17:15+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Main controller of app
 */
app.controller('MainCtrl', function($rootScope, $scope, $uibModal, $state,$window, $http, $translate, AUTH_EVENTS, CONFIG_DATA, USER_ROLES,
    loginService, alertNotifier) {

    $scope.main = {
      title: CONFIG_DATA.BRAND_NAME,
      // googleMapKey: CONFIG_DATA.MAP_API_KEY,
      settings: {
        navbarHeaderColor: 'scheme-gray',
        navbarFooterColor: 'scheme-cream',
        sidebarColor: 'scheme-gray',
        brandingColor: 'scheme-cream',
        activeColor: 'orange-scheme-color',
        headerFixed: true,
        footerFixed: true,
        asideFixed: true,
        rightbarShow: false
      }
    };

    $rootScope.copyrightYear = CONFIG_DATA.COPYRIGHT_YEAR;
    $rootScope.productName = CONFIG_DATA.BRAND_NAME;
    $rootScope.show = true;

    $.fn.dataTable.ext.errMode = 'none';

    $scope.$watch('online', function(newStatus) {});

    $rootScope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
      loginService.logout();
      $state.go('core.login');
    });

    $rootScope.cancel = function() {
      alertNotifier.clearAlerts();
      $rootScope.modalInstance.close();
    };

    $rootScope.allTickets = function(ticketStatus) {
      
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['ticketStatus'] = ticketStatus;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
      $state.go('app.tickets');
    };


    $scope.userRoles = USER_ROLES;
    $scope.isAuthorized = loginService.isAuthorized;

    $scope.logout = function() {
      loginService.logout();
      $state.go('core.login');
    };

    $scope.changeLanguage = function(langKey) {
      $translate.use(langKey);
      $scope.currentLanguage = langKey;
    };

    $scope.currentLanguage = $translate.proposedLanguage() || $translate.use();
  })

  /**
   * Controller to session expire message
   */
  .controller('SessionInstanceCtrl', function($scope, $rootScope, $log, $state, $timeout, $uibModalInstance, Session, loginService, data) {
    $scope.message = data.message;
    $scope.logout = function() {
      $uibModalInstance.dismiss('cancel');
      loginService.logout();
      $state.go('core.login');
      $timeout.cancel($rootScope.warnSessionExpire);
      $timeout.cancel($rootScope.currentSessionExpire);
    };
  })

  // Factory to set current user information
  .service('UserInfoCtrl', function($rootScope, USER_ROLES, CONFIG_DATA, persistData, logReport) {
    return {
      setCurrentUser: function(userInfo) {
        logReport.warn("Tenant Id", userInfo.tenantId);
        $rootScope.currentUser = userInfo.userName !== undefined ? userInfo.userName : userInfo.userMail;
        $rootScope.userImage = (persistData.isValid(userInfo.c_image)) ? userInfo.c_image : userInfo.userImage;
        $rootScope.tenantDomain = userInfo.tenantDomain;
        $rootScope.tenantName = userInfo.tenantName !== undefined ? userInfo.tenantName : '';
        if (userInfo.tenantType !== USER_ROLES.tenant) {
          $rootScope.showMaster = true;
          $rootScope.showTenant = false;
        } else {
          $rootScope.showMaster = false;
          $rootScope.showTenant = true;
        }
      }
    };
  })

  // Utility functions
  .factory('utilityFunctions', function($rootScope, $window, $q, $translate, $uibModal, $uibModalStack, Session, logReport, alertNotifier, toastNotifier, CONFIG_DATA, USER_ROLES) {
    var isSessionExpired = false;
    var utils = {
      setCurrentUser: function(userInfo) {
        console.log("userInfo.expiresAt:", userInfo._expiresAt);
        logReport.warn("Tenant Id", userInfo.tenantId);
        $rootScope.currentUser = userInfo.userName !== undefined ? userInfo.userName : userInfo.userMail;
        $rootScope.userImage = utils.isValid(userInfo.c_image) ? userInfo.c_image : userInfo.userImage;
        $rootScope.tenantDomain = userInfo.tenantDomain;
        $rootScope.tenantName = userInfo.tenantName !== undefined ? userInfo.tenantName : '';
        if (userInfo.tenantType !== USER_ROLES.tenant) {
          $rootScope.showMaster = true;
          $rootScope.showTenant = false;
        } else {
          $rootScope.showMaster = false;
          $rootScope.showTenant = true;
        }
      },
      sessionExpired: function(message) {

        if (!isSessionExpired) {
          var modalInstance = $uibModal.open({
            templateUrl: 'sessionLogoutPrompt.html',
            controller: 'SessionInstanceCtrl',
            backdrop: 'static',
            keyboard: false,
            resolve: {
              data: function() {
                isSessionExpired = true;
                logReport.info("Session", "Popup Opened");
                return {
                  message: message
                };
              }
            }
          });
          $uibModalStack.dismissAll('closing');
          modalInstance.result.then(function(selectedItem) {
            logReport.info("Session", "Popup Closed");
            isSessionExpired = false;
            //alertNotifier.clearAlerts();
          }, function() {
            logReport.info("Session", "Popup Closed");
            isSessionExpired = false;
            //alertNotifier.clearAlerts();
          });

        }
      },
      isValid: function(value) {
        if (value !== "" && value !== null && value !== undefined && value !== "undefined") {
          return true;
        } else {
          return false;
        }
      },
      currentLocation: function() {
        var options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };
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
          }, options);
        } else {
          alertNotifier.showAlert('Geolocation is not supported by this browser.', 'danger', null);
        }
        return deferred.promise;
      },
      geoCode: function(address) {
        // address = address.replace(/ /gi, '+');
        // var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&sensor=true&key=AIzaSyCx_ZaqWDu6leZ7ffeIz5sG9qrN5s4KFF0";
        // return $http.get(url);
        var geocoder = new $window.google.maps.Geocoder();
        var deferred = $q.defer();
        geocoder.geocode({
          'address': address
        }, function(results, status) {
          if (status === $window.google.maps.GeocoderStatus.OK) {
            return deferred.resolve(results);
          }
          return deferred.reject();
        });
        return deferred.promise;
      },

      fetchLatAndLong: function(address, scope) {
        utils.geoCode(address).then(function(results) {
            if (results[0]) {
              scope.latLong = {
                latitude: results[0].geometry.location.lat(),
                longitude: results[0].geometry.location.lng()
              };
              scope.submit();
            } else {
              toastNotifier.showError($translate.instant('VM_INFO.ERROR.LAT_LNG_NOT_FOUND'));
              logReport.warn("Lat Long By Address", JSON.stringify(results));
            }
          },
          function(error) {
            toastNotifier.showError($translate.instant('VM_INFO.ERROR.LAT_LNG_NOT_FOUND'));
            logReport.error("Lat Long By Address", JSON.stringify(error));
          });
      },

      generateRandomAlphaNumericString: function(scope, length) {
        if (scope.isGenerateChecked) {
          scope.user.password = Math.random().toString(36).substr(2, length);
          scope.user.passwordConfirm = scope.user.password;
        } else {
          scope.user.password = '';
          scope.user.passwordConfirm = '';
        }
      },
      showHidePassword: function(scope) {
        if (scope.isShowPasswordChecked) {
          scope.type = "text";
        } else {
          scope.type = "password";
        }
      },
      lowerCaseFirstLetter: function(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
      },
      capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      capitalize: function(input) {
        var reg = " /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/";
        var data = input.replace(reg);
        return data.charAt(0).toUpperCase() + data.substr(1).toLowerCase();

      },
      uploadImage: function(customFields) {

        $rootScope.ajaxloading = true;

        var dataURI = customFields.imageDataUri;
        // convert base64 to raw binary data held in a string
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var arrayBuffer = new ArrayBuffer(byteString.length);
        var _ia = new Uint8Array(arrayBuffer);
        for (var i = 0; i < byteString.length; i++) {
          _ia[i] = byteString.charCodeAt(i);
        }
        var dataView = new DataView(arrayBuffer);
        var blob = new Blob([dataView], {
          type: mimeString
        });

        Kii.initializeWithSite(CONFIG_DATA.APP_ID, CONFIG_DATA.APP_KEY, CONFIG_DATA.URL_PATH);

        KiiUser.authenticateWithToken(Session.token).then(
          function(theUser) {
            // Instantiate a KiiObject.
            var object = KiiObject.objectWithURI(customFields.objectUri);

            // Refresh the KiiObject to retrieve the latest data from Kii Cloud.
            object.refresh().then(
              function(theObject) {
                // Start uploading.
                return theObject.uploadBody(blob, {
                  progress: function(oEvent) {
                    if (oEvent.lengthComputable) {
                      // Get the upload progress. You can update the progress bar with this function.
                      var percentComplete = oEvent.loaded / oEvent.total * 100;
                      logReport.info("Upload Percent Complete", percentComplete);
                    }
                  }
                });
              }
            ).then(
              function(theObject) {
                object.publishBody().then(
                  function(params) {
                    var theObject = params[0];
                    theObject.set("c_image", params[1]);
                    theObject.save();

                    if (utils.isValid(customFields.table)) {
                      customFields.table.dtInstance.reloadData(null, false);
                    }

                    if (utils.isValid(customFields.profile)) {
                      $rootScope.currentUser = customFields.profile;
                      $rootScope.userImage = params[1];
                      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
                      var userInfo = sessionInfo.session;
                      Session.create(userInfo.token, customFields.profile, userInfo.userMail, userInfo.userRole, userInfo.tenantType, userInfo.tenantId, userInfo.tenantName, params[1], userInfo.expiresIn);
                      sessionInfo['session'] = Session;
                      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
                      toastNotifier.showSuccess($translate.instant('PROFILE.SUCCESS.UPDATION_SUCCESS'));
                    }

                    $rootScope.ajaxloading = false;
                    $rootScope.$apply();
                  }
                ).catch(
                  function(error) {
                    logReport.error('Save Object', error);
                    var theObject = error.target;
                    var errorString = error.message;
                    $rootScope.ajaxloading = false;
                    $rootScope.$apply();
                    toastNotifier.showError($translate.instant('PROFILE.ERROR.IMAGE_UPDATION_FAIL'));
                  }
                );
              }
            ).catch(
              function(error) {
                logReport.error('Get Object', error);
                var theObject = error.target;
                var errorString = error.message;
                $rootScope.ajaxloading = false;
                $rootScope.$apply();
                toastNotifier.showError($translate.instant('PROFILE.ERROR.IMAGE_UPDATION_FAIL'));
              }
            );
          }
        ).catch(
          function(error) {
            var theUser = error.target;
            var errorString = error.message;
            $rootScope.ajaxloading = false;
            $rootScope.$apply();
            toastNotifier.showError($translate.instant('PROFILE.ERROR.IMAGE_UPDATION_FAIL'));
            logReport.error('Image Authentication', errorString);
          }
        );
      }
    };
    return utils;
  });
