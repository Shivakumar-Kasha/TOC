/**
 * @Date:   01-27-2017 12:01:63
 * @Project: 24/7PizzaBOX
 * @Last modified time: 04-17-2017 15:04:31
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * @ngdoc directive
 * @name minovateApp.directive:daterangepicker
 * @description
 * # daterangepicker
 */
app
  .directive('daterangepicker', function() {
    return {
      restrict: 'A',
      scope: {
        options: '=daterangepicker',
        start: '=dateBegin',
        end: '=dateEnd'
      },
      link: function(scope, element) {
        element.daterangepicker(scope.options, function(start, end) {
          scope.start = start.format('MMMM D, YYYY');
          scope.end = end.format('MMMM D, YYYY');
          scope.$apply();
        });
      }
    };
  });
