/**
 * @Date:   01-27-2017 12:01:27
 * @Project:Asset Monitoring
 * @Last modified time: 2017-10-11T17:34:37+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller for user login
 */
angular.module('assetManagementApp').controller('LoginCtrl', function($window, $rootScope, $scope, $state, $log, $uibModal, $translate, Session, AUTH_EVENTS, USER_ROLES, CONFIG_DATA, REG_EXP, loginService, UserInfoCtrl, logReport, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.emailPattern = REG_EXP.email;

    $rootScope.loginInfo = {};

    if (!checkSessionStorage()) {
      logReport.error("Session storage not supported");
    } else {
      logReport.info("Session storage supported");
    }

    function checkSessionStorage() {
      return $window.sessionStorage;
    }

    $scope.login = function() {
      loginService.login($scope.loginInfo).then(function(result) {
        logReport.info(JSON.stringify(result));
        var response = result.data.returnedValue.status;
        if (response === CONFIG_DATA.SUCCESS) {
          var userInfo = result.data.returnedValue.data.userData;
          logReport.info(JSON.stringify(userInfo));
          if (!(userInfo._customInfo.isPasswordReset)) {
            userInfo._customInfo['tenantType'] = result.data.returnedValue.data.tenantType;
            userInfo._customInfo['tenantId'] = result.data.returnedValue.data.tenantId;
            userInfo._customInfo['tenantName'] = result.data.returnedValue.data.tenantName;
            userInfo._customInfo['userMail'] = userInfo._emailAddress;
            Session.create(userInfo._accessToken, userInfo._customInfo.userName, userInfo._customInfo.userMail,
              userInfo._customInfo.userRole, userInfo._customInfo.tenantType, userInfo._customInfo.tenantId, userInfo._customInfo.tenantName, userInfo._customInfo.c_image, userInfo._expiresAt);
            $window.sessionStorage["sessionInfo"] = JSON.stringify({
              session: Session
            });
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);

            console.log("_expiresAt:", userInfo._expiresAt);
            UserInfoCtrl.setCurrentUser(userInfo._customInfo);
            // if (userInfo._customInfo.tenantType !== USER_ROLES.tenant) {
            //   $state.go('app.tenants');
            // } else {
            //   $state.go('app.dashboard');
            // }
            $state.go('app.dashboard');
          } else {
            openResetPasswordDialog(userInfo._accessToken);
          }
        } else {
          var message = result.data.returnedValue.message;
          if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.FORBIDDEN_ACCESS) {
            $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
            alertNotifier.showAlert(CONFIG_DATA.FORBIDDEN_ACCESS, 'warning', null);
          } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.FORBIDDEN_ACCESS) {
            $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            alertNotifier.showAlert($translate.instant('Menu.INCORRECT_CREDENTIALS'), 'danger', null);
          }
        }
      }, function(error) {
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
        alertNotifier.showAlert($translate.instant('Menu.SERVER_NOT_FOUND'), 'danger', null);
      });
    };

    /**
     * Function to reset user security details
     * @param {String} accessToken
     */
    function openResetPasswordDialog(accessToken) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'resetPasswordPrompt.html',
        controller: 'ResetPasswordCtrl',
        backdrop: 'static',
        keyboard: false,
        backdropClass: 'splash' + ' ' + "splash-1 splash-ef-1",
        windowClass: 'splash' + ' ' + "splash-1 splash-ef-1",
        resolve: {
          accessToken: function() {
            return accessToken;
          }
        }
      });
    }
  })

  /**
   * Controller to reset user security details
   */
  .controller('ResetPasswordCtrl', function($rootScope, $scope, $state, $translate, Session, CONFIG_DATA, toastNotifier, loginService, logReport, accessToken, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.reset = {};

    $scope.submit = function() {
      var data = {
        userToken: accessToken,
        oldPassword: $scope.reset.currentPassword,
        newPassword: $scope.reset.newPassword
      };

      logReport.info("Input Reset Password", JSON.stringify(data));

      loginService.resetPassword(data).
      then(function(result) {
        var data = result.data.returnedValue;
        logReport.info("Reset Password", JSON.stringify(data));
        var response = data.status;
        var message = data.message;
        if (response === CONFIG_DATA.SUCCESS) {
          toastNotifier.showSuccess($translate.instant('RESET_PASSWORD.SUCCESS.CHANGE_SUCCESS'));
          $rootScope.modalInstance.close();
          $rootScope.loginInfo.userPassword = '';
          $state.go('core.login');
        } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
          toastNotifier.showError($translate.instant('RESET_PASSWORD.ERROR.TOKEN_EXPIRED'));
          $rootScope.loginInfo.userPassword = '';
          $state.go('core.login');
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
