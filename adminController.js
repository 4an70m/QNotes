var app = angular.module("app", ['ngSanitize']);


app.directive('eventFocus', function(focus) {
    return function(scope, elem, attr) {
      elem.on(attr.eventFocus, function() {
        focus(attr.eventFocusId);
      });
      scope.$on('$destroy', function() {
        elem.off(attr.eventFocus);
      });
    };
});
  
app.factory('focus', function($timeout, $window) {
    return function(id) {
      $timeout(function() {
        var element = $window.document.getElementById(id);
        if(element)
          element.focus();
		});
	};
});


app.controller("ctrl", function($scope, focus) {
	$scope.app = {
		notes: [],
		init: function(){
			$scope.pdb = new PouchDB('notes');
			$scope.pdb.allDocs({
			  include_docs: true,
			  attachments: false
			}).then(function (response) {
				$scope.app.notes = response.rows.map(
					function(item){ var newItem = {text: item.doc};  newItem.text.highlighted = false; newItem.text.hidden = false; return newItem;});
					console.log($scope.app.notes);
			  $scope.$apply();
			}).catch(function (err) {
			  console.log(err);
			});
		},
		text: '',
		editing: null,
		addFormVisible: false,
		addNote: function(){
			this.editing = null;
			focus('textarea-1');
			this.addFormVisible = !this.addFormVisible;
			this.text = '';
		},
		saveNote: function(){
			if(this.editing == null){
				var note = {};
				note._id = new Date().getTime() + '';
				note.text = this.text;
				$scope.pdb.put(note, function(error, response) {
					if (error) {
					  console.log(error);
					  return;
					} else if(response && response.ok) {
						$scope.app.notes.push({text:{ _id:response.id, _rev:response.rev, text: note.text}});
						this.text = '';
						$scope.$apply();
					}
				});
			}
			else if (this.editing != null) {
				var note = {};
				note._id = this.editing.text._id;
				note.text = this.text;
				note._rev = this.editing.text._rev;
				note.highlighted = this.editing.text.highlighted;
				note.hidden = this.editing.text.hidden;
				$scope.pdb.put(note, function(error, response) {
					if (error) {
					  console.log(error);
					  return;
					} else if(response && response.ok) {
						$scope.app.notes[$scope.app.editing.index].text = $scope.app.editing.text;
						$scope.app.notes[$scope.app.editing.index].text.text = $scope.app.text;
						$scope.app.notes[$scope.app.editing.index].text._rev = response.rev;
						$scope.app.notes[$scope.app.editing.index].text.highlighted = note.highlighted;
						$scope.app.notes[$scope.app.editing.index].text.hidden = note.hidden;
						$scope.app.text = '';
						$scope.$apply();
					}
				});
			}
			this.addFormVisible = false;
		},
		removeNote: function(index){
			debugger;
			var removedNote = $scope.app.notes[index].text;
			$scope.pdb.remove(removedNote, function(error, response) {
				if (error) {
					console.log(error);
					return;
				} else if(response && response.ok) {
					$scope.app.notes.splice(index,1);
					$scope.$apply();
				}
			});
			this.text = '';	
			this.addFormVisible = false;
		},
		editNote: function(index){
			focus('textarea-1');
			if(this.editing == null)
				this.editing = {};
			this.editing.text = $scope.app.notes[index].text;
			this.editing.index = index;
			$scope.app.addFormVisible = true;
			this.text = $scope.app.notes[index].text.text;
			
		},
		highlightNote: function(index){
			this.notes[index].text.highlighted = !this.notes[index].text.highlighted;
		},
		hideNote: function(index){
			this.notes[index].text.hidden = !this.notes[index].text.hidden;
		}
	}
	$scope.app.init();
});
