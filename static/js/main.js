(function () {

    var app = angular.module('myapp', ['ngMaterial', 'md.data.table'])
    .controller('AppCtrl', function($scope, $http, $mdToast, $mdDialog, $filter) {
        //$scope.anrede = ["N/A","F","M"];
        //$scope.anspr_disabled = false;
        $scope.activeTabNr = 0;
        $scope.sortOrder = true;

        $scope.selected = [];
        $scope.selectedItemSubsi = null;
        $scope.selectedItemTag = null;


        $scope.searchTextSubsi = "";
        $scope.searchTextTag = "";

        $scope.query = {
            order: 'name',
            limit: 5,
            page: 1
        };

//        $scope.subsidiaries = [
//            {name: "Deutschland", id:1},
//            {name: "China", id:2},
//            {name: "United States", id:3},
//            {name: "Japan", id:4},
//        ];


        $scope.transformChip = function(chip) {
          // If it is an object, it's already a known chip
          if (angular.isObject(chip)) {
            return chip;
          }
          // Otherwise, create a new one
          return { name: chip, id: 0 }
        }

        function createFilterFor(query) {
          var lowercaseQuery = angular.lowercase(query);
          return function filterFn(i) {
            return i.name.toLowerCase().indexOf(lowercaseQuery) >= 0;
          };
        }

        $scope.querySearchSubsidiary = function(query) {
          var results = query ? $scope.all_subsidiaries.filter(createFilterFor(query)) : [];
          return results;
        }

        $scope.querySearchTag = function(query) {
          var results = query ? $scope.all_tags.filter(createFilterFor(query)) : [];
          return results;
        }

        $scope.updateSearchCnt = function(){
            var tmp = $scope.filtered.length;
            $scope.data = $scope.filtered;
            $scope.cnt = tmp === 0?"No active entry":tmp === 1 ? "one active entry" : "Totally "+tmp + " entries";
        };

        $scope.resetSearch = function(){

            $scope.searchKey = "";
            refresh();
        }

        $scope.mySort = function(){
            $scope.sortOrder = !$scope.sortOrder;
            $scope.data = $filter('orderBy')($scope.data, "categoryId", $scope.sortOrder);
        }

        $scope.mySortTime = function(){
            $scope.sortOrder = !$scope.sortOrder;
            $scope.data = $filter('orderBy')($scope.data, "created_on", $scope.sortOrder);
        }


        $scope.deleteItem = function(i){
            $mdDialog.show(
              $mdDialog.confirm()
                .parent(angular.element(document.querySelector('body')))
                .clickOutsideToClose(true)
                .title('Warning')
                .textContent('Continue to delete the entry?')
                .ok('OK')
                .cancel('Canel')
            ).then(
                function(){
                    $http({
                              method : "POST",
                              url : "/delete_doc",
                              data : JSON.stringify({id: $scope.data[i].id}),
                              headers : {
                                    "Content-Type" : "application/json"
                              }
                          }
                        ).then(function(response) {
                            refresh();
                            $scope.activeTabNr = 0;
                            if(response.data.trim() == "OK"){
                                $mdToast.show(
                                  $mdToast.simple()
                                    .textContent('OK')
                                    .position("bottom right")
                                    .hideDelay(3000)
                                );
                            }
                        }, function(){
                            $mdToast.show(
                              $mdToast.simple()
                                .textContent('Something goes wrong! Delete process failed.')
                                .position("bottom right")
                                .hideDelay(3000)
                            );
                        }
                    );
                }
            );
        }
        //
        //$scope.doku = function(ev){
        //    $http({
        //              method : "POST",
        //              url : "/doku",
        //              data : JSON.stringify({targ: $scope.current.id}),
        //              headers : {
        //                    "Content-Type" : "application/json"
        //              }
        //          }
        //        ).then(function(response) {
        //            if(response.data.trim() == "OK"){
        //                $mdToast.show(
        //                  $mdToast.simple()
        //                    .textContent('OK')
        //                    .position("bottom right")
        //                    .hideDelay(3000)
        //                );
        //            }
        //        }, function(){
        //            $mdToast.show(
        //              $mdToast.simple()
        //                .textContent('Ein Fehler tritt auf!')
        //                .position("bottom right")
        //                .hideDelay(3000)
        //            );
        //        }
        //    );
        //}
//
//        $scope.checkAnspr = function(){
//            if($scope.current.anrede == $scope.anrede[0]){
//                tmpAnspr = $scope.current.ansprechpartner;
//                $scope.current.ansprechpartner = "";
//                $scope.anspr_disabled = true;
//            }else{
//                if($scope.current.ansprechpartner)
//                    $scope.current.ansprechpartner = $scope.current.ansprechpartner.length >0 ? $scope.current.ansprechpartner : tmpAnspr;
//                $scope.anspr_disabled = false;
//            }
//        }
//        $scope.jobAnpassen = function(ev){
//            //check anrede
//            if(!$scope.current.anrede || ($scope.current.anrede && $scope.current.anrede == $scope.anrede[0]) || $scope.current.anrede.trim().length == 0){
//                $scope.current.anrede = null;
//                $scope.current.ansprechpartner = null;
//                $scope.current.ansp_vor = null;
//                $scope.current.ansp_nach = null;
//            }else{
//                if(!$scope.current.ansprechpartner){
//                      $mdToast.show(
//                          $mdToast.simple()
//                            .textContent('Name ist Leer aber mit Anrede! ')
//                            .position("bottom right")
//                            .hideDelay(3000)
//                      );
//                    return;
//                }
//
//                if($scope.current.ansprechpartner.indexOf("/") !== -1){
//                    var tmp = $scope.current.ansprechpartner.split("/")
//                    $scope.current.ansp_vor = tmp[0].trim();
//                    $scope.current.ansp_nach = tmp[1].trim();
//                }else{
//                    // without separator but normal 2-part name
//                    var tmp = $scope.current.ansprechpartner.split(" ");
//                    if(tmp.length == 2){
//                        $scope.current.ansp_vor = tmp[0].trim();
//                        $scope.current.ansp_nach = tmp[1].trim();
//                    }else{
//                        $mdToast.show(
//                          $mdToast.simple()
//                            .textContent('Name ungültig! ' + $scope.current.ansprechpartner)
//                            .position("bottom right")
//                            .hideDelay(3000)
//                        );
//
//                        return;
//                    }
//                }
//            }
//
//            var canceled = true;
//
//            $mdDialog.show(
//              $mdDialog.confirm()
//                .parent(angular.element(document.querySelector('body')))
//                .clickOutsideToClose(true)
//                .title('Warnung')
//                .textContent('Anpassung wird in Datenbank übernommen.')
//                .ok('Los!')
//                .cancel('Canel')
//                .targetEvent(ev)
//            ).then(
//                function(){
//                    var tmpHasKey = $scope.current['$$hashKey'];
//                    delete $scope.current['$$hashKey'];
//
//                    $http({
//                              method : "POST",
//                              url : "/change",
//                              data : JSON.stringify($scope.current),
//                              headers : {
//                                    "Content-Type" : "application/json"
//                              }
//                          }
//                        ).then(function(response) {
////                            refresh($scope.currentIndex);
//                            if(response.data.trim() == "OK"){
//                                $mdToast.show(
//                                  $mdToast.simple()
//                                    .textContent('OK')
//                                    .position("bottom right")
//                                    .hideDelay(3000)
//                                );
//                            }
//                        }, function(){
//                            $mdToast.show(
//                              $mdToast.simple()
//                                .textContent('Ein Fehler tritt auf! Bitte URL überprüfen!')
//                                .position("bottom right")
//                                .hideDelay(3000)
//                            );
//                        }
//                    );
//
//                    $scope.current['$$hashKey'] = tmpHasKey;
//                }
//            );
//        }


        var getTags = function(){
            $http({
                      method : "GET",
                      url : "/tags"
                  }
                ).then(function(response) {
                    $scope.all_tags = response.data;
                    $scope.tagNameSet = new Set($scope.all_tags.map(e=>e.name));
                }
             );
        }



        var refresh = function(idx){
            idx = idx || 0;


//        get init data
            $http({
                      method : "GET",
                      url : "/subsidiaries"
                  }
                ).then(function(response) {
                    $scope.all_subsidiaries = response.data;
                }
            );

            getTags();



            $http({
                      method : "GET",
                      url : "/docs"
                  }
                ).then(function(response) {
                    $scope.data = response.data;
                    $scope.dataBackup = response.data;
                    var tmp = $scope.data.length;
                    $scope.cnt = tmp === 0?"No active entry":tmp === 1 ? "one active entry" : "Totally "+tmp + " entries";
                    $scope.cntBackup = $scope.cnt;
                    if(tmp > 0){
                        $scope.current = $scope.data[idx];
                        $scope.current['signed_on'] = new Date($scope.current['signed_on']);
                    }
                    else
                        $scope.current = {};

                }
            );
        }

        refresh();

        $scope.refresh = refresh;

        $scope.selectItem = function(i){
            $scope.current = $scope.data[i];
            $scope.activeTabNr = 2;
            $scope.currentIndex = i;
        }

        $scope.myshow = function(){
            console.log($scope.current.tags.filter(e=>e.id==0 && !$scope.tagNameSet.has(e.name)).map(e=>e.name));
        }

        $scope.addNewTags = function(){
            var newTags = $scope.current.tags.filter(e=>e.id==0 && !$scope.tagNameSet.has(e.name)).map(e=>e.name);
            $http({
                      method : "POST",
                      url : "/add_tag",
                      data : JSON.stringify({tags: newTags}),
                      headers : {
                            "Content-Type" : "application/json"
                      }
                  }
                ).then(function(response) {
                    getTags();
                }, function(){
                    $mdToast.show(
                      $mdToast.simple()
                        .textContent('Something goes wrong! Add New Tag failed.')
                        .position("bottom right")
                        .hideDelay(3000)
                    );
                }
            );
        }


    });
})();