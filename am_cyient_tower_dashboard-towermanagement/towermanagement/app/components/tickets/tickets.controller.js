/**
 * @Author: santhoshbabu
 * @Date:   06-08-2017 13:44:53
 * @Project: Asset Monitoring
 * @Last modified by:   santhoshbabu
 * @Last modified time: 08-31-2017 11:01:47
 * @Copyright: 2017, Kii Corporation www.kii.com
 */


'use strict';
/** Controller to fetch TICKET information */
angular.module('assetManagementApp').controller('TicketsCtrl', function($rootScope, $scope, $window, $compile, persistData, dataTable, toastNotifier, logReport, $filter, $translate, $uibModal, $log, $q, Session, DTOptionsBuilder, DTColumnBuilder, CONFIG_DATA, AUTH_EVENTS, ticketsFactory, alertNotifier) {
    alertNotifier.clearAlerts();
    var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
    var nextPaginationKey = '';
    var draw;
    var TOKEN = Session.token;
    var vm = this;

    vm.edit = editTicket;
    vm.tickets = {};
    vm.dtInstance = {};
    $scope.tickets = {};

    var ticketFilterData = {};

    $.fn.dataTable.ext.errMode = 'none';

    $scope.options = CONFIG_DATA.ALERTS.OPTIONS;

    $scope.tickets.filterType = "all";

    $scope.Filter_unFilter = "Filter";

    $scope.resetTicketFilter = function() {
      ticketsFactory.setTicketsFilter('');
      vm.dtInstance.reloadData(null, false);
    };

    $scope.openFilter = function() {

      var modalInstance = $uibModal.open({
        templateUrl: 'filterPrompt.html',
        controller: 'FilterInstanceCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
      modalInstance.result.then(function(selectedItem) {
        $scope.selected = selectedItem;
      }, function() {
        $log.info('Tickets filter modal dismissed at: ' + new Date());
      });

    };

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: (((CONFIG_DATA.SERVICES.getTickets.replace('{ticketStatus}', sessionInfo['ticketStatus'])).replace('{tenantID}', ticketsFactory.getTicketsFilter().tenantID || 'all')).replace('{towerID}', ticketsFactory.getTicketsFilter().towerID || 'all')).replace('{statusFilterType}',sessionInfo['statusFilterType']),
        type: 'GET',
        headers: {
          "X-Kii-AppID": CONFIG_DATA.APP_ID,
          "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
          "Authorization": "Basic " + Session.token,
          "Content-Type": "application/json",
          "X-XSS-Protection": 1,
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
          "Access-Control-Allow-Origin": "*"
        },
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
            var response = JSON.parse(result);
            var recordsData = {
              draw: draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            };

            if(response.status === 200) {
              recordsData['recordsTotal'] = response.data.recordsTotal;
              recordsData['recordsFiltered'] = response.data.recordsTotal;
              var data= [];
              angular.forEach(response.data.tickets, function(ticket, index) {
                ticket['id']=index;
                data.push(ticket);
              });
              recordsData['data'] = data;
            } else if(response.status === 403) {
              utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
            } else {

            }
            return recordsData;
          }
        },
        error: function(error) {
          logReport.error("Get Tickets Information", JSON.stringify(error));
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
      .withOption('order', [4, 'desc'])
      .withOption('serverSide', true)
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER') + " " + $translate.instant('Menu.ASSETTYPE') + " " + $translate.instant('LABELS.NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.tower_id + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p> ' + data.sensor + '  </p>';
      }),

      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {
        return '<p style="color:' + data.class + '"> ' + data.reading + '  </p>';
      }),
      DTColumnBuilder.newColumn(null).
      renderWith(function(data, type, full, meta) {


      return  data.action;
      }),
      // DTColumnBuilder.newColumn(null).
      // renderWith(function(data, type, full, meta) {
      //   return '<p style="color:' + data.class + '"> ' + data.TICKET + ' </p>';
      // }),
      DTColumnBuilder.newColumn(null)
      .renderWith(function(data, type, full, meta) {
        return '<p>' + $filter('date')(data.modified, 'MM-dd-yyyy HH:mm:ss a') + ' </p>';
      }),
      DTColumnBuilder.newColumn(null)
      .renderWith(function(data, type, full, meta) {
        vm.tickets[data.id] = data;
      return '<div class="text-center"><button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="ticketsInfo.edit(ticketsInfo.tickets[' + data.id + '])">' +
        '   <i class="fa fa-edit"></i>' +
        '</button></div>'
      })
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    /**
     * Function to edit user information
     * @param  {JSON} ticketInfo
     */
    function editTicket(ticketInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'ticketStatusContent.html',
        controller: 'EditTicketCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          ticketInfo: function() {
            return ticketInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }


  })

  .controller('FilterInstanceCtrl', function(GeoCode,$rootScope, $scope, $uibModalInstance, $compile, vm, ticketsFactory, alertNotifier,toastNotifier,logReport,Session,tenantsService,USER_ROLES,$translate,persistData,dashboardService) {

    alertNotifier.clearAlerts();
    $scope.filter = ticketsFactory.getTicketsFilter();

    console.info($scope.filter);

    angular.element('#slider').on('slideStop', function(data) {
      updateModel(data.value);
    });

    $scope.updateModel = function(data) {
      $scope.$apply(function() {
        $scope.filter.radius = data.value;
      });
    };

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
    if (Session.tenantType === USER_ROLES.master) {
      dashboardService.getAssetsService( 'all', {
        userToken: Session.token,
        start: 0,
        length: 100,
        filter: []
      }).then(function(result) {


        logReport.info("Towers Data", JSON.stringify(result));
        if(result.data.status === 200) {

          $scope.towers = result.data.data.assets;
        } else if(result.data.status === 403) {
          utilityFunctions.sessionExpired($translate.instant('Menu.SESSION_EXPIRED'));
        }

      }, function(error) {
        logReport.error("Import Models From Master", JSON.stringify(error));
        toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
      });
    }


    $scope.filterData = function() {
      if(persistData.isValid($scope.filter.address)){
      GeoCode.latLong($scope.filter.address)
        .then(function(results) {
          if (results[0]) {
          var latLong = {
              latValue: results[0].geometry.location.lat(),
              lonValue: results[0].geometry.location.lng()
            };

  logReport.info(JSON.stringify(latLong));





          } else {
            alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
          }
        }, function(error) {
          alertNotifier.showAlert($translate.instant('ASSET_INFO.ERROR.LAT_LNG_NOT_FOUND'), 'danger', null);
        });
        }
      ticketsFactory.setTicketsFilter($scope.filter);
      console.log("ticketsFactory1111###########",JSON.stringify(ticketsFactory.getTicketsFilter()));
      vm.dtInstance.reloadData(null, false);
      $uibModalInstance.dismiss('cancel');
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * ticketsFactory used to set and get tickets filter data
   */
  .factory('ticketsFactory', function($window, persistData) {
    var ticketsFilter = {};

    ticketsFilter.setTicketsFilter = function(filterData) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['ticketsFilter'] = filterData;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };

    ticketsFilter.getTicketsFilter = function() {
      if (persistData.isValid(JSON.parse($window.sessionStorage["sessionInfo"]).ticketsFilter)) {
        return JSON.parse($window.sessionStorage["sessionInfo"]).ticketsFilter;
      } else {
        return {
          tenantID: '',
          towerID: '',
          fromDate: '',
          toDate: ''

        };
      }
    };
    console.log("ticketsFactory###########",JSON.stringify(ticketsFilter));
    return ticketsFilter;
  })
  .controller('EditTicketCtrl', function($scope, $translate, Session, persistData, logReport, REG_EXP, toastNotifier, ticketsService, ticketInfo, vm, utilityFunctions, alertNotifier) {
    alertNotifier.clearAlerts();
    angular.extend($scope, {
      Add_or_Edit_User: $translate.instant('CRUD.EDIT'),
      Add_or_Update: $translate.instant('BUTTONS.UPDATE'),

      ticketStatus:ticketInfo.status

    });
    $scope.submit = function() {
        var data = {
        userToken: Session.token,
        ticketId:ticketInfo.ticket_id,
        assetId:ticketInfo.tower_id,
        status:$scope.ticketStatus
      };


      logReport.info("Edit Ticket Information", JSON.stringify(data));
      ticketsService.editTicket(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('TICKETS.SUCCESS.UPDATION_SUCCESS'),
            errorMessage: $translate.instant('TICKETS.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);

          }
        },
        function(error) {
          logReport.error("Edit User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  });
