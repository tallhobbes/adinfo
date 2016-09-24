function surveyController($scope) {
	$scope.message = "jah mon";
	$scope.survey = [{"name":"jonnyboy"},{"name":"boyjonny"}];
	$scope.change = function(q,a){
		//console.log(q,a);
		$scope.answers[q] = a;
		//var test = $scope.answers;
		//console.log(test);
	};

	$scope.testFun = function(){
		console.log($scope.section);
	};

	$scope.prompts = [
	{"code":"q1","text":"I think this activity is interesting"},
	{"code":"q2","text":"I am doing this for my own good"},
	{"code":"q3","text":"I am supposed to do it"},
	{"code":"q4","text":"There may be good reasons to do this activity, but personally I don't see any"},
	{"code":"q5","text":"I think this activity is pleasant"},
	{"code":"q6","text":"I think this activity is good for me"},
	{"code":"q7","text":"This is something that I have to do"},
	{"code":"q8","text":"I do this activity but I am not sure if it is worth it"},
	{"code":"q9","text":"This activity is fun"},
	{"code":"q10","text":"I'm doing this by personal decision"},
	{"code":"q11","text":"I don't have any choice"},
	{"code":"q12","text":"I don't know; I don't see what this activity brings me"},
	{"code":"q13","text":"I feel good when doing this activity"},
	{"code":"q14","text":"I believe that this activity is important for me"},
	{"code":"q15","text":"I feel that I have to do it"},
	{"code":"q16","text":"I do this activity, but I am not sure it is a good thing to pursue it"}
	];

	$scope.answers = {};
	$scope.test = 'hithere';

	$scope.legend = {
		1:"corresponds not at all",
		2:"corresponds very little",
		3: "corresponds a little",
		4: "corresponds moderately",
		5: "corresponds enough",
		6: "corresponds a lot",
		7: "corresponds exactly",
	}


	$scope.section = {"type":"multi", 
	"prompts":[
	{"code":"q1","text":"I think this activity is interesting"},
	{"code":"q2","text":"I am doing this for my own good"},
	{"code":"q3","text":"I am supposed to do it"},
	{"code":"q4","text":"There may be good reasons to do this activity, but personally I don't see any"},
	{"code":"q5","text":"I think this activity is pleasant"},
	{"code":"q6","text":"I think this activity is good for me"},
	{"code":"q7","text":"This is something that I have to do"},
	{"code":"q8","text":"I do this activity but I am not sure if it is worth it"},
	{"code":"q9","text":"This activity is fun"},
	{"code":"q10","text":"I'm doing this by personal decision"},
	{"code":"q11","text":"I don't have any choice"},
	{"code":"q12","text":"I don't know; I don't see what this activity brings me"},
	{"code":"q13","text":"I feel good when doing this activity"},
	{"code":"q14","text":"I believe that this activity is important for me"},
	{"code":"q15","text":"I feel that I have to do it"},
	{"code":"q16","text":"I do this activity, but I am not sure it is a good thing to pursue it"}
	],
	"responses":[
	{"short":1,"long":"corresponds not at all"},
	{"short":2,"long":"corresponds very little"},
	{"short":3,"long":"corresponds a little"},
	{"short":4,"long":"corresponds moderately"},
	{"short":5,"long":"corresponds enough"},
	{"short":6,"long":"corresponds a lot"},
	{"short":7,"long":"corresponds exactly"},
	]};
};