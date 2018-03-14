/**
 * @Date:   02-14-2017 17:02:49
 * @Project: 24/7PizzaBOX
 * @Last modified time: 07-06-2017 18:16:26
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to reset user security details
 */
angular.module('assetManagementApp').controller('ResetPassCtrl', function($rootScope, $scope, $state, $translate, $uibModal, CONFIG_DATA, toastNotifier, alertNotifier, resetPassService, logReport) {
  alertNotifier.clearAlerts();
  $scope.reset = {};
  $scope.hideReset = false;
  $scope.hideMessage = true;

  $scope.resetFields = function() {
    $scope.reset = {};
    $scope.resetPasswordForm.$setPristine();
    $scope.resetPasswordForm.$setValidity();
    $scope.resetPasswordForm.$setUntouched();
  };

  $scope.resetPassword = function() {
    var userId = getParameterByName('id');
    var code = getParameterByName('code');

    var data = {
      id: userId,
      code: code,
      newPassword: $scope.reset.newPassword
    };

    resetPassService.resetPassword(data).
    then(function(result) {
      var data = result.data.returnedValue;
      logReport.info("Reset Password", JSON.stringify(data));
      var response = data.status;
      var message = data.message;
      if (response === CONFIG_DATA.SUCCESS) {
        toastNotifier.showSuccess($translate.instant('RESET_PASSWORD.SUCCESS.CHANGE_SUCCESS'));
        $state.go('core.login');
      } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.LINK_EXPIRED) {
        toastNotifier.showError($translate.instant('RESET_PASSWORD.ERROR.LINK_EXPIRED'));
      } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.LINK_EXPIRED) {
        toastNotifier.showError($translate.instant('RESET_PASSWORD.ERROR.UNKNOWN_ERROR'));
      }
    }, function(error) {
      logReport.error("Reset Password", JSON.stringify(error));
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });
  };

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
});
