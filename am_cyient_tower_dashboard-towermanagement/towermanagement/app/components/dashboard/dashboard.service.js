/**
 * @Date:   02-24-2017 17:02:89
 * @Project: 24/7PizzaBOX
 * @Last modified time: 08-21-2017 19:32:17
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for dashboard server calls
 */

app.factory('dashboardService', function($http, CONFIG_DATA, logReport, Session) {
  var dashboardServiceInfo = {};

  dashboardServiceInfo.getOverView = function() {
    var HEADERS = {
      "X-Kii-AppID": CONFIG_DATA.APP_ID,
      "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
      "Authorization": 'Basic' +" " +Session.token,
      'Content-Type': 'application/json'
    };
    return $http
      .get(CONFIG_DATA.SERVICES.getOverViewMethod,  {
        headers:HEADERS
      });
  };

dashboardServiceInfo.getTowerList = function(){

  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
    .get(CONFIG_DATA.SERVICES.getTowerListMethod,  {
      headers:QUERYPARAMS
    });

};

dashboardServiceInfo.getOverallHealthList = function(data){

  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
    .post(CONFIG_DATA.SERVICES.getAssets,data, {
      headers:QUERYPARAMS
    });

};


dashboardServiceInfo.getPowerConsumptionCatagory = function(){

var QUERYPARAMS = {
  "X-Kii-AppID": CONFIG_DATA.APP_ID,
  "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
  "Authorization": 'Basic' +" " +Session.token,
  'Content-Type': 'application/json'
};
return $http
    .get(CONFIG_DATA.SERVICES.getPowerConsumptionCatagoryMethod, {
      headers:QUERYPARAMS
    });

};

dashboardServiceInfo.getGpPowerVsDgPower = function(params){
  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
return $http
    .get(CONFIG_DATA.SERVICES.getGpPowerVsDgPowerMethod, {
      headers:QUERYPARAMS,
      params: params
    });
};

dashboardServiceInfo.getTopAlarms = function(){
  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getTopAlarmsMethod, {
      headers:QUERYPARAMS
  });
};

dashboardServiceInfo.getTopAlerts = function(){
  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getTopAlertsMethod, {
      headers:QUERYPARAMS
  });
};


dashboardServiceInfo.getAlarmTrends = function(params){
  var QUERYPARAMS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getAlarmTrendsMethod, {
      headers:QUERYPARAMS,
      params: params
  });
};

dashboardServiceInfo.getFireAndSmokeTrends = function(params){
  var HEADERS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getFireAndSmokeTrendsMethod, {
      headers:HEADERS,
      params: params

  });
};

dashboardServiceInfo.getIntrusionsDetected = function(params){
  var HEADERS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getIntrusionsDetectedMethod, {
      headers:HEADERS,
      params: params

  });
};

dashboardServiceInfo.getVoltageDCAlarms = function(params){
  var HEADERS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getVoltageDCAlarmsMethod, {
      headers:HEADERS,
      params: params
  });
};

dashboardServiceInfo.getDgFuelConsumption = function(params){
  var HEADERS = {
    "X-Kii-AppID": CONFIG_DATA.APP_ID,
    "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
    "Authorization": 'Basic' +" " +Session.token,
    'Content-Type': 'application/json'
  };
  return $http
  .get(CONFIG_DATA.SERVICES.getDgFuelConsumptionMethod, {
      headers:HEADERS,
      params: params
  });
};


  /**
   * Service call to get machines From KAFKA
   * @param  {JSON} data
   * @return {JSON} response
   */
  dashboardServiceInfo.getAssetsService = function(tenantId, data) {
    var HEADERS = {
      "X-Kii-AppID": CONFIG_DATA.APP_ID,
      "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
      "Content-Type": "application/json",
    };
    logReport.info(JSON.stringify(HEADERS) + "\n" + JSON.stringify(data));
    return $http
      .post(CONFIG_DATA.SERVICES.getAssets + tenantId, data, {
        headers: HEADERS
      });
  };

  /**
   * Service call to get machines
   * @param  {JSON} data
   * @return {JSON} response
   */
  dashboardServiceInfo.getAssets = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DASHBOARD.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete machines
   * @param  {JSON} data
   * @return {JSON} response
   */
  dashboardServiceInfo.deleteAsset = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DASHBOARD.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get issue types
   * @param  {JSON} data
   * @return {JSON} response
   */
  dashboardServiceInfo.getIssueTypes = function(data, tenantId) {
    var HEADERS = {
      "X-Kii-AppID": CONFIG_DATA.APP_ID,
      "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
      "Content-Type": "application/json",
    };
    console.error(JSON.stringify(HEADERS) + "\n" + JSON.stringify(data));
    return $http
      .post(CONFIG_DATA.SERVICES.getIssues + tenantId, data, {
        headers: HEADERS
      });
  };

  /**
   * Service call to get alert issues
   * @param  {JSON} data
   * @return {JSON} response
   */
  dashboardServiceInfo.getStatus = function(data, tenantId) {
    var HEADERS = {
      "X-Kii-AppID": CONFIG_DATA.APP_ID,
      "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
      "Content-Type": "application/json",
    };
    console.error(JSON.stringify(HEADERS) + "\n" + JSON.stringify(data));
    return $http
      .post(CONFIG_DATA.SERVICES.getStatus + tenantId, data, {
        headers: HEADERS
      });
      };
  return dashboardServiceInfo;
});
