var app = angular.module("PassportApp");

app.controller("NavCtrl", function($rootScope, $scope, $http, $location) {
  $scope.logout = function() {
    $http.post("/logout")
      .success(function() {
        $rootScope.currentUser = null;
        $location.url("/home");
      });
  }
});

app.controller("SignUpCtrl", function($scope, $http, $rootScope, $location) {
  $scope.signup = function(user) {
    console.log(user);

    // TODO: verify passwords are the same and notify user
    if (user.password == user.password2) {
      $http.post('/signup', user)
        .success(function(user) {
          $rootScope.currentUser = user;
          $location.url("/profile");
          console.log(user);
        });
    }
  }
});

app.controller("LoginCtrl", function($location, $scope, $http, $rootScope) {
  $scope.login = function(user) {
    console.log(user);
    $http.post('/login', user)
      .success(function(response) {
        console.log(response);
        $rootScope.currentUser = response;
        $location.url("/profile");
      });
  }
});

app.controller("ProfileCtrl", function($scope, $http) {
  $http.get("/rest/user")
    .success(function(users) {
      $scope.users = users;
    });
});