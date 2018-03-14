/**
 * @Date:   04-20-2017 18:04:80
 * @Project: AssetMonitoring
 * @Last modified time: 07-11-2017 11:44:40
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

app
  .directive('alertDisplay', ['alertNotifier', function(alertNotifier) {
    return {
      restrict: 'AE',
      template: '<div ng-repeat="alert in vm.alerts" class="alert alert-{{alert.type}}" role="alert"><button ng-click="vm.closeAlert($index)" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>{{alert.msg}}</div>',
      controller: function() {
        var vm = this;

        vm.alertService = alertNotifier;

        vm.alerts = vm.alertService.alerts;

        vm.closeAlert = function(index) {
          vm.alertService.closeAlert(index);
        };
      },
      controllerAs: 'vm'
    };
  }]);
