/**
 * @Author: santhoshbabu
 * @Date:   05-24-2017 10:36:32
 * @Project: Asset Monitoring
 * @Last modified time: 08-22-2017 19:35:22
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch asset type information
 */
angular.module('assetManagementApp').controller('AssetTypesCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, CONFIG_DATA, AUTH_EVENTS, toastNotifier, alertNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, logReport, USER_ROLES, assetTypeService) {
    alertNotifier.clearAlerts();
    var draw = null;
    var assetType = this;
    assetType.dtInstance = {};
    assetType.assetTypes = {};
    assetType.delete = deleteAssetType;

    $.fn.dataTable.ext.errMode = 'none';

    assetType.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_TYPES.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.assetTypes.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.assetTypes.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Asset Type Query", JSON.stringify(d));

          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get  Asset Types Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Asset Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      })
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', {
        details: {
          renderer: function(api, rowIndex) {
            var data = dataTable.rendererRows(api, rowIndex);
            // gets the table and append the rows
            var table = angular
              .element('<table/>')
              .append(data);

            // compile the table to keep the events
            $compile(table.contents())($scope);
            return table;
          }
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('serverSide', true);

    assetType.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      assetType.assetTypes[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="assetTypes.delete(assetTypes.assetTypes[' + data.id + '])" )"="">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    // Add Asset group
    $scope.openAddAssetTypePrompt = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addAssetTypePrompt.html',
        controller: 'AddAssetTypeCtrl as showAssets',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assetType: function() {
            return assetType;
          }
        }
      });
    };

    /**
     * Function to delete asset group
     * @param  {JSON} assetTypeInfo
     */
    function deleteAssetType(assetTypeInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteAssetTypePrompt.html',
        controller: 'DeleteAssetTypeCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assetTypeInfo: function() {
            return assetTypeInfo;
          },
          assetType: function() {
            return assetType;
          }
        }
      });
    }
    //Import assetTypes from master to tenant
    //   if (Session.tenantType !== USER_ROLES.master) {
    //     assetTypeService.copyAssetTypesFromMaster({
    //       userToken: Session.token
    //     }).then(function(result) {
    //       var customInfo = {
    //         successMessage: "",
    //         alreadyExists: "",
    //         errorMessage: ""
    //       };
    //
    //       logReport.info("Import Asset Types From Master", JSON.stringify(result));
    //
    //       var validData = persistData.validifyData(result, customInfo);
    //
    //       if (Object.keys(validData).length !== 0) {
    //         assetType.dtInstance.reloadData(null, false);
    //       }
    //     }, function(error) {
    //       logReport.error("Import Asset Types From Master", JSON.stringify(error));
    //       toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    //     });
    //   }
  })

  /**
   * Controller to add asset type
   */
  .controller('AddAssetTypeCtrl', function($rootScope, $scope, $compile, $sanitize, $uibModalInstance, $translate, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, assetType, assetTypeService, DTOptionsBuilder, DTColumnBuilder) {
    $scope.Add_or_Update_Asset = $translate.instant('CRUD.ADD');
    $scope.Add_or_Update = $translate.instant('BUTTONS.CREATE');
    $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.MANDATORY');


    $scope.submit = function() {
      var assetDetails = {
        userToken: Session.token,
        c_name: $scope.assetTypes
      };

      assetTypeService.addAssetType(assetDetails).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('ASSET_TYPE.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('ASSET_TYPE.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('ASSET_TYPE.ERROR.CREATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            assetType.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Add Asset Type Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to delete asset information
   */
  .controller('DeleteAssetTypeCtrl', function($scope, $rootScope, $translate, Session, toastNotifier, persistData, logReport, assetTypeInfo, assetTypeService, assetType, alertNotifier) {
    alertNotifier.clearAlerts();

    logReport.info(JSON.stringify(assetTypeInfo))
    $scope.assetTypeNameToDelete = assetTypeInfo.c_name;

    function deleteAssetType() {

      assetTypeService.deleteAssetType({
        userToken: Session.token,
        c_id: assetTypeInfo.c_id
      }).
      then(function(result) {
          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('ASSET_TYPE.ERROR.DELETION_FAIL')
          };
          var validData = persistData.validifyData(result, customInfo);
          logReport.info("Asset Deletion" + JSON.stringify(validData.data.recordsExists));
          var recordExists = validData.data.recordsExists;
          if (Object.keys(validData).length !== 0) {
            //vm.dtInstance.reloadData(null, false);
          }
          if (recordExists === 0) {
            toastNotifier.showSuccess($translate.instant('ASSET_TYPE.SUCCESS.DELETION_SUCCESS'));
            assetType.dtInstance.reloadData(null, false);
            $rootScope.modalInstance.close();
          } else {
            deleteAssets();
          }
        },
        function(error) {
          logReport.error("Delete Asset Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );

    }
    $scope.deleteAssetType = function() {

      deleteAssetType();
    };
  })
