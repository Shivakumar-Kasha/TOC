/**
 * @Date:   01-27-2017 12:01:48
 * @Project: AssetMonitoring
 * @Last modified time: 06-07-2017 12:20:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for tenants server calls
 */
app.factory('tenantsService', function($window, $rootScope, $http, $q, $translate, $log, Session, toastr, CONFIG_DATA, AUTH_EVENTS) {
  var tenantsServiceInfo = {};

  /**
   * Service call to add tenant information
   * @param  {JSON} data
   * @return {JSON} response
   */
  tenantsServiceInfo.addTenant = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get tenants information
   * @param  {JSON} data
   * @return {JSON} response
   */
  tenantsServiceInfo.getTenants = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get specific tenant information
   * @param  {JSON} data
   * @return {JSON} response
   */
  tenantsServiceInfo.getTenantDetails = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.tenantDetails, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update tenant information
   * @param  {JSON} data
   * @return {JSON} response
   */
  tenantsServiceInfo.updateTenant = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.putMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete tenant information
   * @param  {JSON} data
   * @return {JSON} response
   */
  tenantsServiceInfo.deleteTenant = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return tenantsServiceInfo;
});
