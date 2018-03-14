/**
 * @Date:   01-27-2017 12:01:02
 * @Project: 24/7PizzaBOX
 * @Last modified time: 08-21-2017 18:46:38
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * @ngdoc directive
 * @name minovateApp.directive:chartMorris
 * @description
 * # chartMorris
 * https://github.com/jasonshark/ng-morris/blob/master/src/ngMorris.js
 */
app
  .directive('morrisLineChart', function($filter) {

    return {
      restrict: 'A',
      scope: {
        lineData: '=',
        lineXkey: '@',
        lineYkeys: '@',
        lineLabels: '@',
        lineColors: '@',
        linePostunits: '@'
      },
      link: function(scope, elem, attrs) {
        var colors,
          morris;
        if (scope.lineColors === void 0 || scope.lineColors === '') {
          colors = null;
        } else {
          colors = JSON.parse(scope.lineColors);
        }
        scope.$watch('lineData', function() {
          if (scope.lineData) {
            if (!morris) {
              console.info(scope);
              morris = new Morris.Line({
                element: elem,
                data: scope.lineData,
                xkey: scope.lineXkey,
                ykeys: JSON.parse(scope.lineYkeys),
                labels: JSON.parse(scope.lineLabels),
                lineColors: colors || ['#0b62a4', '#7a92a3', '#4da74d', '#afd8f8', '#edc240', '#cb4b4b', '#9440ed'],
                postUnits: scope.linePostunits,
                resize: true,
                xLabelFormat: function(x) {
                  var isWeek = false;
                  angular.forEach(scope.lineData, function(value, key) {
                    if (value.time.indexOf("w") > -1 || value.time.indexOf("W") > -1) {
                      isWeek = true;
                    }
                  });
                  var d = new Date(x);
                  if (isWeek) {
                    d.setDate(d.getDate() - 7);
                  }
                  return $filter('date')(d, "MM-dd-yyyy");
                }
              });
            } else {
              morris.setData(scope.lineData);
            }
          }
        });
      }
    };
  })

  .directive('morrisAreaChart', function() {

    return {
      restrict: 'A',
      scope: {
        lineData: '=',
        lineXkey: '@',
        lineYkeys: '@',
        lineXlabels: '@',
        lineLabels: '@',
        lineColors: '@',
        linePostunits: '@',
        lineParsetime: '@',
        lineWidth: '@',
        fillOpacity: '@',
        showGrid: '@'
      },
      link: function(scope, elem, attrs) {
        var colors,
          morris;
        if (scope.lineColors === void 0 || scope.lineColors === '') {
          colors = null;
        } else {
          colors = JSON.parse(scope.lineColors);
        }
        scope.$watch('lineData', function() {
          if (scope.lineData) {
            if (!morris) {
              morris = new Morris.Area({
                element: elem,
                data: scope.lineData,
                xkey: scope.lineXkey,
                ykeys: JSON.parse(scope.lineYkeys),
                labels: JSON.parse(scope.lineLabels),
                lineColors: colors || ['#0b62a4', '#7a92a3', '#4da74d', '#afd8f8', '#edc240', '#cb4b4b', '#9440ed'],
                postUnits: scope.linePostunits,
                parseTime: scope.lineParsetime,
                xLabels: scope.lineXlabels,
                lineWidth: scope.lineWidth || '0',
                fillOpacity: scope.fillOpacity || '0.8',
                grid: scope.showGrid || false,
                resize: true
              });
            } else {
              morris.setData(scope.lineData);
            }
          }
        });
      }
    };
  })

  .directive('morrisBarChart', function() {
    return {
      restrict: 'A',
      scope: {
        barData: '=',
        barXkey: '@',
        barYkeys: '@',
        barLabels: '@',
        barColors: '@',
        barStacked: '@'
      },
      link: function(scope, elem, attrs) {

        var colors,
          morris;
        if (scope.barColors === void 0 || scope.barColors === '') {
          colors = null;
        } else {
          colors = JSON.parse(scope.barColors);
        }

        scope.$watch('barData', function() {
          if (scope.barData) {
            if (!morris) {
              morris = new Morris.Bar({
                element: elem,
                data: scope.barData,
                xkey: scope.barXkey,
                ykeys: JSON.parse(scope.barYkeys),
                labels: JSON.parse(scope.barLabels),
                barColors: colors || ['#0b62a4', '#7a92a3', '#4da74d', '#afd8f8', '#edc240', '#cb4b4b', '#9440ed'],
                xLabelMargin: 2,
                stacked: scope.barStacked,
                hideHover: true,
                barSizeRatio: 0.2,
                resize: true,
                hoverCallback: function(index, options, content, row) {
                  return '<strong>' + options.data[index].sensorType + '</strong><br/>Issues: ' + options.data[index].issuesCount;
                }
              });
            } else {
              morris.setData(scope.barData);
            }
          }
        });
      }
    };
  })

  .directive('morrisDonutChart', function() {
    return {
      restrict: 'A',
      scope: {
        donutData: '=',
        donutColors: '@'
      },
      link: function(scope, elem, attrs) {
        var colors,
          morris;
        if (scope.donutColors === void 0 || scope.donutColors === '') {
          colors = null;
        } else {
          colors = JSON.parse(scope.donutColors);
        }

        scope.$watch('donutData', function() {
          if (scope.donutData) {
            if (!morris) {
              morris = new Morris.Donut({
                element: elem,
                data: scope.donutData,
                colors: colors || ['#0B62A4', '#3980B5', '#679DC6', '#95BBD7', '#B0CCE1', '#095791', '#095085', '#083E67', '#052C48', '#042135'],
                resize: true
              });
            } else {
              morris.setData(scope.donutData);
            }
          }
        });
      }
    };
  });
