/**
 * @Date:   01-27-2017 12:01:61
 * @Project: 24/7PizzaBOX
 * @Last modified time: 04-17-2017 12:04:86
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

app.directive('loading', ['$http', function($http) {
  return {
    restrict: 'A',
    //   template: '<div class="dot1"></div><div class="dot2"></div>',
    link: function(scope, elm, attrs) {
      scope.isLoading = function() {
        return $http.pendingRequests.length > 0;
      };

      scope.$watch(scope.isLoading, function(v) {
        if (v) {
          elm.show();
        } else {
          elm.hide();
        }
      });
    }
  };

}]);
