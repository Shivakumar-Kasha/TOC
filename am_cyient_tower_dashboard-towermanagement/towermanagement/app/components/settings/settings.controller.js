/**
 * @Date:   01-27-2017 12:01:58
 * @Project: AssetMonitoring
 * @Last modified time: 09-01-2017 15:31:09
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to show and update user profile information
 */
angular.module('assetManagementApp').controller('UserProfileCtrl', function($window, $rootScope, $scope, $state, $translate, Session, AUTH_EVENTS, CONFIG_DATA, persistData, logReport, toastNotifier, usersService, utilityFunctions, alertNotifier) {

    alertNotifier.clearAlerts();
    var image = '';
    var objectUri = '';
    $scope.user = {};

    var data = {
      userToken: Session.token,
      filter: [{
        key: 'userMail',
        value: Session.userMail,
        filterType: 'eq'
      }]
    };

    logReport.info("User Profile Query", JSON.stringify(data));

    $scope.reloadData = function() {
      usersService.getUsers(data).then(function(result) {
        var customInfo = {
          successMessage: '',
          alreadyExists: '',
          errorMessage: $translate.instant('USERS.ERROR.RETRIEVE_FAIL')
        };

        var validData = persistData.validifyData(result, customInfo);

        logReport.info("User Profile Information", JSON.stringify(validData));

        if (validData.length !== 0) {
          var userProfile = validData.data.records[0]._customInfo;
          image = userProfile.c_image;
          objectUri = validData.data.records[0].objectURI;
          $scope.user = {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            userMail: userProfile.userMail,
            userRole: userProfile.userRole,
            phoneNumber: userProfile.phoneNumber,
            image: userProfile.c_image,
            userStatus: userProfile.userStatus,
          };
        }
      }, function(error) {
        logReport.error("User Profile Information", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    };

    $scope.submit = function() {
      var data = {
        userToken: Session.token,
        userEmailToUpdate: $scope.user.userMail,
        userData: {
          firstName: $scope.user.firstName,
          phoneNumber: $scope.user.phoneNumber,
          lastName: $scope.user.lastName,
          userRole: $scope.user.userRole,
          userStatus: $scope.user.userStatus
        }
      };
      logReport.info("@@@" + JSON.stringify(data));
      usersService.editUser(data).
      then(function(result) {
          var customInfo = {
            successMessage: '',
            alreadyExists: $translate.instant('USERS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('USERS.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            var userName = $scope.user.firstName + ' ' + $scope.user.lastName;
            if (persistData.isValid($scope.user.image) && $scope.user.image !== image) {
              utilityFunctions.uploadImage({
                imageDataUri: $scope.user.image,
                objectUri: objectUri,
                profile: userName
              });
            } else {
              var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
              var userInfo = sessionInfo.session;
              Session.create(userInfo.token, userName, userInfo.userMail, userInfo.userRole, userInfo.tenantType, userInfo.tenantId, userInfo.tenantName, userInfo.userImage, userInfo.expiresIn);
              sessionInfo['session'] = Session;
              $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
              $rootScope.currentUser = userName;
              toastNotifier.showSuccess($translate.instant('PROFILE.SUCCESS.UPDATION_SUCCESS'));
            }
          }
        },
        function(error) {
          logReport.error("Profile Update Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to update user security details
   */
  .controller('UserSecurityCtrl', function($window, $rootScope, $scope, $state, $translate, Session, AUTH_EVENTS, CONFIG_DATA, persistData, logReport, toastNotifier, alertNotifier, loginService, usersService, utilityFunctions) {
    alertNotifier.clearAlerts();
    $scope.security = {
      userMail: Session.userMail
    };

    $scope.resetCopy = angular.copy($scope.security);

    $scope.cancel = function() {
      $scope.security = angular.copy($scope.resetCopy);
      $scope.securityForm.$setPristine();
      $scope.securityForm.$setValidity();
      $scope.securityForm.$setUntouched();
      $scope.$apply();
    };

    $scope.resetPassword = function() {

      var data = {
        userToken: Session.token,
        oldPassword: $scope.security.currentPassword,
        newPassword: $scope.security.newPassword
      };

      logReport.info("Input Reset Password", JSON.stringify(data));

      loginService.resetPassword(data).
      then(function(result) {
        var data = result.data.returnedValue;
        logReport.info("Reset Password", JSON.stringify(data));
        var response = data.status;
        var message = data.message;
        if (response === CONFIG_DATA.SUCCESS) {
          utilityFunctions.sessionExpired($translate.instant('Menu.PASSWORD_UPDATED_SESSION_EXPIRED'));
        } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
        } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.WRONG_PASSWORD) {
          toastNotifier.showError($translate.instant('RESET_PASSWORD.ERROR.WRONG_PASSWORD'));
        } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.IN_VALID_TOKEN) {
          toastNotifier.showError($translate.instant('RESET_PASSWORD.ERROR.CHANGE_FAIL'));
        }
      }, function(error) {
        logReport.error("Reset Password", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    };
  });
