/**
 * @Date:   01-27-2017 12:01:90
 * @Project: 24/7PizzaBOX
 * @Last modified time: 08-31-2017 18:21:04
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch analytics charts
 */
angular.module('assetManagementApp').controller('AnalyticsCtrl', function($rootScope, $scope, $filter, $moment, $translate, $uibModal, Session, analyticsFactory, analyticsService, CONFIG_DATA, AUTH_EVENTS, USER_ROLES, persistData, utilityFunctions, logReport, toastNotifier) {

    var url = CONFIG_DATA.KAFKA_URL;
    var tenantIdSelected = "";
    if (Session.tenantType !== USER_ROLES.tenant) {

      tenantIdSelected = 'all';

    } else {
      tenantIdSelected = Session.tenantId;
    }

    /**
     * Resets filter
     * @return {JSON} return charts based on filter
     */
    $scope.resetAnalyticsFilter = function() {
      analyticsFactory.setAnalyticsFilter('');
      $rootScope.getSensorIssuesChart();
      $rootScope.getAssetIssueChart();
    };

    $scope.openFilter = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'analyticsFilterPrompt.html',
        controller: 'AnalyticsFilterCtrl',
        backdrop: 'static',
        keyboard: true
      });
    };


    $rootScope.getSensorIssuesChart = function() {

      var params = prepareParams();
      // $scope.fromDate = params.queryParams.fromDate;
      // $scope.toDate = params.queryParams.toDate;

      var tenantId = params.tenantId;
      analyticsService.getSensorIssues(params.queryParams, tenantId).then(function(result) {
          logReport.info(" Sensor Issues  Response ", JSON.stringify(result));
          var items = [];

          if (result.status === 200) {
            var records = result.data.data;
            if (records.sensorIssues.length !== 0) {
              items = records.sensorIssues;
            } else {
              items = [{
                "sensorType": "No Data Available",
                "issuesCount": 0
              }];
            }

            $scope.getSensorIssuesData = items;

          } else if (result.status === 403) {
            $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout);
          } else if (result.status === 500) {

            toastNotifier.showError($translate.instant('ANALYTICS.ERROR.SENSOR_ISSUE_CHART'));
          }
        },
        function(error) {
          logReport.error("Sensor Issues  Response", JSON.stringify(error));
          if (error.status === 403) {
            utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
          } else {
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          }
        });
    };

    $rootScope.getAssetIssueChart = function() {
      var params = prepareParams();
      var tenantId = params.tenantId;
      analyticsService.getAssetsIssues(params.queryParams, tenantId).then(function(result) {
          logReport.info("Assets Issues Response ", JSON.stringify(result));
          var items = [];

          if (result.status === 200) {
            var records = result.data;
            if (records.data.length > 0) {
              $scope.warehouseIssueData = records.data;
              items = records.sensorAlerts;
            } else {
              $scope.warehouseIssueData = [{
                time: $translate.instant('INFO.NO_DATA_AVAILABLE'),
                count: null
              }];
            }
          } else if (result.status === 403) {
            $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout);
          } else if (result.status === 500) {

            toastNotifier.showError($translate.instant('ANALYTICS.ERROR.ASSET_ISSUE_CHART'));
          }
        },

        function(error) {
          logReport.error("Assets Issues  Response", JSON.stringify(error));
          if (error.status === 403) {
            utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
          } else {
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          }
        });
    };


    function prepareParams() {
      var analyticsFilter = analyticsFactory.getAnalyticsFilter();
      var tenantId = '';

      if (persistData.isValid(analyticsFilter.tenantId)) {
        tenantId = analyticsFilter.tenantId;
      } else {
        tenantId = 'all';
      }

      if (Session.tenantType !== USER_ROLES.master) {
        tenantId = Session.tenantId;
      } else {

        tenantId = tenantId;

      }
      $scope.analytics = analyticsFilter;
      var queryParams = {
        fromDate: $filter('date')(analyticsFilter.fromDate, "yyyy-MM-dd"),
        toDate: $filter('date')(analyticsFilter.toDate, "yyyy-MM-dd"),
        userToken: Session.token,
      };

      return {
        tenantId: tenantId,
        queryParams: queryParams
      };
    }
  })

  .controller('AnalyticsFilterCtrl', function($rootScope, $scope, $uibModalInstance, CONFIG_DATA, USER_ROLES, $moment, persistData, analyticsFactory, toastNotifier, dataTable, Session, logReport, modelsService, tenantsService, $translate) {

    $scope.locationOptions = CONFIG_DATA.DASHBOARD.LOCATION_OPTIONS;
    var filterData = analyticsFactory.getAnalyticsFilter();
    $scope.models = [];
    $scope.tenants = [];
    $scope.filter = {
      fromDate: new Date(filterData.fromDate),
      toDate: new Date(filterData.toDate),
      tenantId: filterData.tenantId
    };
    $scope.clear = function() {
      $scope.analytics.from = null;
      $scope.analytics.to = null;
    };

    // Disable weekend selection
    $scope.disabled = function(date, mode) {
      return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function($event, id) {
      $event.preventDefault();
      $event.stopPropagation();

      if (id === 'from') {
        $scope.fromOpened = true;
      } else if (id === 'to') {
        $scope.toOpened = true;
      }
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      'class': 'datepicker'
    };

    $scope.format = 'MM/dd/yyyy';

    modelsService.getModels({
      userToken: Session.token,
      filter: []
    }).then(function(result) {
      var customInfo = {
        successMessage: "",
        alreadyExists: "",
        errorMessage: $translate.instant('MODELS.ERROR.RETRIEVE_FAIL')
      };

      var validData = persistData.validifyData(result, customInfo);

      if (Object.keys(validData).length !== 0) {
        $scope.models = validData.data.records;
      }
    }, function(error) {
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });

    //Show tenants for master
    if (Session.tenantType === USER_ROLES.master) {
      tenantsService.getTenants({
        userToken: Session.token,
        filter: []
      }).then(function(result) {
        var customInfo = {
          successMessage: "",
          alreadyExists: "",
          errorMessage: $translate.instant('TENANTS.ERROR.RETRIEVE_FAIL')
        };

        logReport.info("Tenants Data", JSON.stringify(result));

        var validData = persistData.validifyData(result, customInfo);

        if (Object.keys(validData).length !== 0) {
          $scope.tenants = validData.data.records;
        }

      }, function(error) {
        logReport.error("Import Models From Master", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.filterAnalytics = function() {
      if ($scope.filter.fromDate.getTime() > $scope.filter.toDate.getTime()) {
        toastNotifier.showWarning($translate.instant('INFO.FROM_DATE_SHOULD_LESS_THAN_DATE'));
        return false;
      } else {
        analyticsFactory.setAnalyticsFilter($scope.filter);
        $scope.getSensorIssuesChart();
        $scope.getAssetIssueChart();
        $uibModalInstance.dismiss('cancel');
      }
    };
  })

  /**
   * analyticsFactory used to set and get analytics filter data
   */
  .factory('analyticsFactory', function($window, persistData) {
    var analyticsFilter = {};
    var date = new Date();
    var filterData = {};

    analyticsFilter.setAnalyticsFilter = function(data) {
      //filterData = data;
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['analyticsFilter'] = data;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };

    analyticsFilter.getAnalyticsFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).analyticsFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).analyticsFilter;
      } else {
        return {
          fromDate: new Date(date.getFullYear(), date.getMonth(), 1),
          toDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          tenantId: '',
          selectedAnalyticsTenant: ''
        };
      }
    };

    return analyticsFilter;
  });
