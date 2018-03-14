/**
 * @Date:   01-27-2017 12:01:15
 * @Project: 24/7PizzaBOX
 * @Last modified time: 06-19-2017 12:49:47
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller for header
 */
angular.module('assetManagementApp').controller('HeaderCtrl', function($rootScope, $scope, $uibModal, $timeout, $translate, utilityFunctions, Session, CONFIG_DATA) {

    var currentDate = new Date();
    var modifiedDate = new Date();
    modifiedDate.setMinutes(currentDate.getMinutes() + CONFIG_DATA.SESSION_LASTS_IN);

    $rootScope.warnSessionExpire = $timeout(warnSessionExpire, (Session.expiresIn - modifiedDate.getTime()));
    $timeout.cancel($rootScope.warnSessionExpire);

    function warnSessionExpire() {
      $uibModal.open({
        templateUrl: 'sessionExpireWarning.html',
        controller: 'SessionExpireWarnCtrl',
        size: 'md',
        backdrop: 'static',
        keyboard: true
      });
    }

    $rootScope.currentSessionExpire = $timeout(sessionExpired, (Session.expiresIn - currentDate.getTime()));
    $timeout.cancel($rootScope.currentSessionExpire);

    function sessionExpired() {
      utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
    };

    $scope.showDownloadPopup = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'downloadMobileAppPrompt.html',
        controller: 'DownloadMobileAppCtrl',
        size: 'lg',
        backdrop: 'static',
        keyboard: true
      });
    };
  })

  /**
   * Controller to show session expire warning
   */
  .controller('SessionExpireWarnCtrl', function($scope, $translate, $interval, $uibModalInstance, Session) {

    showMessage();

    $interval(showMessage, 1000);

    function showMessage() {
      var currentDate = new Date();
      $scope.message = $translate.instant('Menu.SESSION_EXPIRE_WARNING') + ' ' + millisToMinutesAndSeconds(Session.expiresIn - currentDate.getTime()) + ' ' + $translate.instant('Menu.SESSION_EXPIRE_WARNING_CONTINUE_MINUTES');
    }

    function millisToMinutesAndSeconds(millis) {
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    $scope.close = function() {
      $uibModalInstance.dismiss('cancel');
    };

  })

  /**
   * Controller to download mobile apps
   */
  .controller('DownloadMobileAppCtrl', function($scope, $rootScope, $log, $translate, $uibModalInstance, Session, headerService, CONFIG_DATA, AUTH_EVENTS, toastNotifier, utilityFunctions, logReport) {

    var dempApp = "";
    var technicianApp = "";

    var postData = {
      bucketQuery: {
        clause: {
          type: "all"
        }
      }
    };

    headerService.getMobileAppUrls(postData).then(function(response) {
        logReport.info("Mobile Urls:" + JSON.stringify(response));
        dempApp = response.data.results[0].demoApp;
        technicianApp = response.data.results[0].technicianApp;
      },
      function(error) {
        if (error.status === 403) {
          $uibModalInstance.dismiss('cancel');
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
        } else {
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      }
    );

    $scope.downloadDemoApp = function() {
      $scope.downloadDemoAppApk = dempApp;
    };

    $scope.downloadTechnicianApp = function() {
      $scope.downloadTechnicianAppApk = technicianApp;
    };

    $scope.sendLinkForDemoApp = function() {
      var data = {
        message: 'Download demo app here. \n' + dempApp,
        number: '+' + $scope.phoneNumber
      };

      headerService.sendLink(data).
      then(function(response) {
          $log.info("Status Data: " + JSON.stringify(response));
          var sent = response.data.sent;
          var failed = response.data.failed;
          if (sent.length !== 0 && failed.length === 0) {
            toastNotifier.showSuccess($translate.instant('Menu.SENT_LINK'));
            // $uibModalInstance.dismiss('cancel');
          } else if (sent.length === 0 && failed.length !== 0) {
            toastNotifier.showError($translate.instant('Menu.FAIL_TO_SEND_LINK'));
          }
        },
        function(error) {
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };

    $scope.sendLinkForTechnicianApp = function() {
      var data = {
        message: 'Download tech app here. \n' + technicianApp,
        number: '+' + $scope.RTphoneNumber
      };

      headerService.sendLink(data).
      then(function(response) {
          $log.info("Status data: " + JSON.stringify(response));
          var sent = response.data.sent;
          var failed = response.data.failed;
          if (sent.length !== 0 && failed.length === 0) {
            toastNotifier.showSuccess($translate.instant('Menu.SENT_LINK'));
            // $uibModalInstance.dismiss('cancel');
          } else if (sent.length === 0 && failed.length !== 0) {
            toastNotifier.showError($translate.instant('Menu.FAIL_TO_SEND_LINK'));
          }
        },
        function(error) {
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  });
