/**
 * @Date:   01-27-2017 12:01:60
 * @Project: 24/7PizzaBOX
 * @Last modified time: 08-21-2017 17:39:57
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

app.factory('analyticsService', function($http, CONFIG_DATA) {
  var analyticsServiceInfo = {};

  var headers = {
    'X-Kii-AppID': CONFIG_DATA.APP_ID,
    'X-Kii-AppKey': CONFIG_DATA.APP_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  /**
   * Service call to fetch revenue chart information
   * @param  {String} url
   * @param  {JSON} queryParams
   * @return {JSON} response
   */
  /**
   * Service call to get sensor  issues
   * @param  {JSON} data
   * @return {JSON} response
   */
  analyticsServiceInfo.getSensorIssues = function(data, tenantId) {


    return $http
      .post(CONFIG_DATA.SERVICES.getSensorIssues + tenantId, data, {
        headers: headers
      });
  };

  /**
   * Service call to get warehouse  issues
   * @param  {JSON} data
   * @return {JSON} response
   */
  analyticsServiceInfo.getAssetsIssues = function(data, tenantId) {

    return $http
      .post(CONFIG_DATA.SERVICES.getAssetIssues + tenantId, data, {
        headers: headers
      });
  };

  return analyticsServiceInfo;
});
