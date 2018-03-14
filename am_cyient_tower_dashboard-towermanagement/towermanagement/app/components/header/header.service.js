/**
 * @Date:   01-27-2017 12:01:24
 * @Project: 24/7PizzaBOX
 * @Last modified time: 06-19-2017 12:42:57
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for header server calls
 */
app.factory('headerService', function($http, CONFIG_DATA, Session) {
  var headerServiceInfo = {};

  /**
   * Service call to get mobile app urls
   * @param  {JSON} data
   * @return {JSON} response
   */
  headerServiceInfo.getMobileAppUrls = function(data) {
    return $http
      .post(CONFIG_DATA.KII_URL + "buckets/AM_MobileApps/query", data, {
        headers: {
          'Content-Type': 'application/vnd.kii.QueryRequest+json',
          'Authorization': 'Bearer ' + Session.token
        }
      });
  };

  /**
   * Service call to send download link to given number
   * @param  {JSON} data
   * @return {JSON} response
   */
  headerServiceInfo.sendLink = function(data) {
    return $http
      .post(CONFIG_DATA.BROADCAST_URL, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
  };

  return headerServiceInfo;
});
