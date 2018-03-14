/**
 * @Author: santhoshbabu
 * @Date:   05-19-2017 14:46:19
 * @Project: Asset Monitoring
 * @Last modified by:   santhoshbabu
 * @Last modified time: 08-30-2017 21:20:38
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * @ngdoc directive
 * @name AssetMonitoring.directive:common.js
 * @description
 * # focusme, onlyDigits
 */



app

  .directive('focusMe', function($timeout) {
    return {
      scope: {
        trigger: '@focusMe'
      },
      link: function(scope, element) {
        scope.$watch('trigger', function(value) {
          if (value === "true") {
            // console.log('trigger',value);
            $timeout(function() {
              element[0].focus();
            });
          }
        });
      }
    };
  })

  .directive('noSpecialChar', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function(scope, element, attrs, modelCtrl) {
        modelCtrl.$parsers.push(function(inputValue) {
          if (inputValue == undefined)
            return ''
          var cleanInputValue = inputValue.replace(/[^\w\s]/gi, '');
          if (cleanInputValue != inputValue) {
            modelCtrl.$setViewValue(cleanInputValue);
            modelCtrl.$render();
          }
          return cleanInputValue;
        });
      }
    }
  })


  .directive('onlyDigits', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function(scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val) {
            var digits = val.replace(/[^0-9.]/g, '');

            if (digits.split('.').length > 2) {
              digits = digits.substring(0, digits.length - 1);
            }

            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return parseFloat(digits);
          }
          return undefined;
        }
        ctrl.$parsers.push(inputValue);
      }
    };
  })

  .filter('capitalizeFirst', function() {
    return function(input, scope) {
      var text = input.substring(0, 1).toUpperCase() + input.substring(1).toLowerCase();
      return text;
    }
  })

  .directive('capitalizeFirst', ['$filter', function($filter) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        controller.$parsers.push(function(value) {
          var transformedInput = $filter('capitalizeFirst')(value);
          if (transformedInput !== value) {
            var el = element[0];
            el.setSelectionRange(el.selectionStart, el.selectionEnd);
            controller.$setViewValue(transformedInput);
            controller.$render();
          }
          return transformedInput;
        });
      }
    };
  }]);
