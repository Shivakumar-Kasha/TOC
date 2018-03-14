/**
 * @Date:   01-27-2017 12:01:31
 * @Project: 24/7PizzaBOX
 * @Last modified time: 12-29-2017 12:42:55
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller for advanced rules
 */
angular.module('assetManagementApp').controller('AdvancedRulesCtrl', function($rootScope, $scope, $sce, $base64, $http, $translate, Session, CONFIG_DATA, AUTH_EVENTS, rulesService, persistData, utilityFunctions, logReport, alertNotifier, toastNotifier) {
  var TOKEN = Session.token;
  alertNotifier.clearAlerts();
  $scope.options = CONFIG_DATA.RULES.RULES_URL;
  $scope.rules = $scope.options[0].option;
  var rulesKeys = Object
    .keys($scope.options);

  $scope.changeRules = function() {
    rulesService.isValidToken({
      'userToken': TOKEN
    }).then(function(result) {
      logReport.info("Token Valid Response", JSON.stringify(result));
      var response = result.data.returnedValue.status;
      var message = result.data.returnedValue.message;
      if (response === CONFIG_DATA.SUCCESS) {
        for (var i = 0; i < rulesKeys.length; i++) {
          var id = rulesKeys[i];
          var rule = $scope.options[id];
          if ($scope.rules === rule.option) {
            $scope.businessRulesUrl = $sce.trustAsResourceUrl(CONFIG_DATA.RULES.DEPLOYED_URL + (CONFIG_DATA.RULES.RULES_URL_PATTERN).replace(/#####/g, rule.option) + '&token=' + TOKEN + '&appID=' + CONFIG_DATA.APP_ID + '&appKey=' + CONFIG_DATA.APP_KEY);
            logReport.error($scope.businessRulesUrl);
          }
        }
      } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
        utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
      } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.IN_VALID_TOKEN) {}
    }, function(error) {
      logReport.error("Rules Deployed Information", JSON.stringify(error));
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });
  };

  $scope.deployRules = function() {
    rulesService.isValidToken({
      'userToken': TOKEN
    }).then(function(result) {
      logReport.info("Token Valid Response", JSON.stringify(result));
      var response = result.data.returnedValue.status;
      var message = result.data.returnedValue.message;
      if (response === CONFIG_DATA.SUCCESS) {
        var droolsUserName = result.data.returnedValue.droolsUserName;
        var droolsUserPassword = result.data.returnedValue.droolsUserPassword;
        var auth = $base64.encode(droolsUserName + ':' + droolsUserPassword),
          headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + auth
          };
        $http
          .post(CONFIG_DATA.RULES.DEPLOYED_URL + CONFIG_DATA.RULES.DEPLOY_URL, {
            headers: headers
          }).then(function success(response) {
            console.log(JSON.stringify(response));
            if (response.data.status === CONFIG_DATA.RULES.APPROVED) {
              alertNotifier.showAlert($translate.instant('RULES.SUCCESS.DEPLOY_SUCCESS'), 'success', null);
              var url = CONFIG_DATA.RULES.DEPLOYED_URL.split('/');
              $http
                .post(url[0] + CONFIG_DATA.RULES.UPDATE_CONFIG, {
                  isNewBuildAvailable: true
                }, {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }).then(function success(response) {
                  logReport.info("Rules Server Response", JSON.stringify(response));
                  if (response.data.hasOwnProperty('updated')) {
                    logReport.info("Version updated");
                  } else {
                    logReport.info("Version not updated");
                  }
                }, function error(response) {
                  toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                });
            } else {
              alertNotifier.showAlert($translate.instant('RULES.ERROR.DEPLOY_FAIL'), 'danger', null);
            }
          }, function error(response) {
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          });
      } else if (response === CONFIG_DATA.FAIL && message === CONFIG_DATA.IN_VALID_TOKEN) {
        utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
      } else if (response === CONFIG_DATA.FAIL && message !== CONFIG_DATA.IN_VALID_TOKEN) {}
    }, function(error) {
      logReport.error("Rules Deployed Information", JSON.stringify(error));
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });
  };
});
