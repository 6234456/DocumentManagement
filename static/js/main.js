(function () {

    var app = angular.module('myapp', ['ngMaterial', 'md.data.table'])
    .controller('AppCtrl', function($scope, $http, $mdToast, $mdDialog, $filter) {
        $scope.activeTabNr = 0;

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

        $scope.categorySelectedItemChange = function(i){
            if(i){
                $scope.current.category = i;
                $scope.current.categoryName = i.name;
            }
        }

        $scope.transformChip = function(chip) {
          if (angular.isObject(chip)) {
            return chip;
          }

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

        var getCategories = function(){
            $http({
                      method : "GET",
                      url : "/categories"
                  }
                ).then(function(response) {
                    $scope.all_categories = response.data;
                }
            );
        }

        getCategories();

        var getSubsidiaries = function(){
            $http({
                      method : "GET",
                      url : "/subsidiaries"
                  }
                ).then(function(response) {
                    $scope.all_subsidiaries = response.data;
                }
            );
        }

        var getDocs = function(idx){
            idx = idx || 0;
            $http({
                      method : "GET",
                      url : "/docs"
                  }
                ).then(function(response) {
                    $scope.data = response.data;

                    if($scope.data.length > 0){
                        $scope.current = $scope.data[idx];
                        $scope.current_backup = angular.copy($scope.data[idx]);
                        $scope.current['signed_on'] = new Date($scope.current['signed_on']);
                    }
                    else
                        $scope.current = {};
                }
            );
        }

        var refresh = function(idx){
            getTags();
            getSubsidiaries();
            getDocs(idx);
        }

        refresh();

        $scope.refresh = refresh;

        $scope.selectItem = function(i){
            $scope.current = angular.copy($scope.data[i]);
            $scope.activeTabNr = 2;
            $scope.currentIndex = i;
        }

        $scope.myshow = function(){
            console.log($scope.current.tags.filter(e=>e.id==0 && !$scope.tagNameSet.has(e.name)).map(e=>e.name));
            console.log($scope.current.categoryName);
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