/**
 * @Date:   02-14-2017 17:02:49
 * @Project: 24/7PizzaBOX
 * @Last modified time: 07-06-2017 18:17:02
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to send forgot password link to mail
 */
angular.module('assetManagementApp').controller('ForgotPassCtrl', function($scope, $state, $translate, CONFIG_DATA, REG_EXP, forgotPassService, toastNotifier, logReport, alertNotifier) {
  alertNotifier.clearAlerts();
  $scope.emailPattern = REG_EXP.email;
  $scope.hideForgotUI = false;
  $scope.hideMessage = true;

  /**
   * Sends a dynamic password to user entered mail
   */
  $scope.forgotPassword = function() {
    forgotPassService.forgotPassword({
      userMail: $scope.userMailId
    }).
    then(function(result) {
      var data = result.data.returnedValue;
      logReport.info(JSON.stringify(data));
      var response = data.status;
      if (response === CONFIG_DATA.SUCCESS) {
        // toastNotifier.showSuccess($translate.instant('FORGOT_PASSWORD.SUCCESS.CHANGE_SUCCESS'));
        // $state.go('core.login');
        $scope.hideForgotUI = true;
        $scope.hideMessage = false;
      } else {
        toastNotifier.showError($translate.instant('FORGOT_PASSWORD.ERROR.CHANGE_FAIL'));
      }
    }, function(error) {
      logReport.error("Forget Password", JSON.stringify(error));
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });
  };
});
