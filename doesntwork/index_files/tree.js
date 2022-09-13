var root         = document.documentElement,
    toolBar      = document.querySelector('[role="toolbar"]'),
    alertRoot    = document.querySelector('[data-js="deleteNode"] .root'),
    alertConfirm = document.querySelector('[data-js="deleteNode"] .confirm');

// All the button and body clicks are intercepted here.
document.addEventListener('click', function (e) {
  var clickType = e.target.getAttribute('data-js');
  // User has selected a node
  if (clickType === 'node') {
    selectNode(e);
  } else if (clickType !== '' && clickType !== null) {
    // Buttons within the toolbar, at the top of the page
    if      (clickType === 'promoteSibling') promoteSibling();
    else if (clickType === 'demoteSibling')  demoteSibling();
    else if (clickType === 'editName')       editName();
    else if (clickType === 'editItem')       editItem();
    else if (clickType === 'deleteNode')     deleteNode(e);
    else if (clickType === 'addChild')       addChild();
  } else {
    // User has clicked outside of a node
    deselectNodes();
    hideToolbar();
  }
});



// For sending node rename commands to PHP when focus goes away from node buttons
// Maybe optimize by testing on client side if name really is changed?
document.addEventListener('focusout', function (e) {
	if (e.target.getAttribute("data-js") == "node" &&
		e.target.parentElement.parentElement.parentElement.className != "tree") {

		// We assume there is some element with class "tree" on top of our tree in HTML (usually this is div)
		var sroot = e.target;

		while (sroot.className != "tree") {
			sroot = sroot.parentElement;
		}

		// Update node name to database
		const formData = new FormData();

		formData.append("tree", sroot.id);
		formData.append("id", e.target.id);
		formData.append("name", e.target.innerHTML);
		formData.append("action", "rename");

		const request = new XMLHttpRequest();
		request.open("POST", "/pages/editdb.php");
		request.onload = function () {
			console.log(this.response);
		};

		request.send(formData);
	} 
});


// Allows the user to reorder the tree with the keyboard
root.addEventListener('keydown', function (e) {
	var keyPress;
	
	// New method vs. old method
	if (e.key) keyPress = e.key;
	else       keyPress = e.which;
	
	/*
		If the user is editing a node name we need to override
		default action for space which is pressing the button
	*/
	if (e.target.getAttribute('contenteditable')) {
		if (e.code == 'Space') {
			e.preventDefault()
			document.execCommand("insertText", false, ' ')  
		}
	} else {
		if (keyPress === 'ArrowRight' || keyPress === '37') {
			demoteSibling();
		} else if (keyPress === 'ArrowLeft' || keyPress === '39') {
			promoteSibling();
		}
	}

	// This is useful whether the user is editing the button or not
	if (keyPress === 'ArrowDown' || keyPress === '40')
		addChild();
	
});

// Set cursor to the end of contenteditable element
function setCursor(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}


// Deselects all other nodes, selects the current node and hooks in the toolbar
function selectNode(e) {
  var clicker = e.target;
  // Hang on - do we need to do anything?
  if (clicker.getAttribute('aria-pressed') === 'false') {
    deselectNodes();
    clicker.setAttribute('aria-pressed', 'true');
    clicker.classList.add('selected');
    showToolbar();   
  }
}

// Bit of cleanup, after the user has finished editing the tree.
function deselectNodes() {
  // This needs to run from scratch as new nodes might have been added
  var selectedBtns = [...document.querySelectorAll('.tree [aria-pressed="true"]')],
      btnDelete = document.querySelector('[data-js="deleteNode"]'),
      editBtns = [...document.querySelectorAll('.tree [contenteditable]')];
  // I mean, in theory, there should only be one selected button, but, you know, bugs...
  for (var i = 0; i < selectedBtns.length; i++) {
    selectedBtns[i].setAttribute('aria-pressed', 'false');
    selectedBtns[i].classList.remove('selected');
  }
  // Bit of cleanup, in case the user noped out of deleting a node
  if (btnDelete.classList.contains('js-confirm')) {
    btnDelete.classList.remove('js-confirm');
    alertConfirm.setAttribute('aria-hidden','true');
  }
  if (btnDelete.classList.contains('js-root')) {
    btnDelete.classList.remove('js-root');
    alertRoot.setAttribute('aria-hidden','true');
  }
  // Checks for new nodes which are editable, then turns them off.
  for (var i = 0; i < editBtns.length; i++) {
    editBtns[i].removeAttribute('contenteditable');
  }
}

function showToolbar() {
  toolBar.removeAttribute('aria-hidden');
  toolBar.classList.add('show');
}

function hideToolbar() {
  toolBar.setAttribute('aria-hidden','true');
  toolBar.classList.remove('show');
}

// Moves the sibling to the left
function promoteSibling() {
	var node = document.querySelector('.tree .selected');

	// We assume there is some element with class "tree" on top of our tree in HTML (usually this is div)
	var sroot = node;
	while (sroot.className != "tree") {
		sroot = sroot.parentElement;
	}

	if (node) {
		var favouriteChild = document.querySelector('.tree .selected').parentNode,
			elderChild = favouriteChild.previousElementSibling;

		// Does this selected element have anywhere to go?
		if (elderChild) {
//			alert("1: " + node.id + " 2: " + elderChild.children[0].id);
			favouriteChild.parentNode.insertBefore(favouriteChild, elderChild);
			
			const formData = new FormData();

			formData.append("tree", sroot.id);
			formData.append("id", node.id);
			formData.append("id2", elderChild.children[0].id);
			formData.append("action", "swap");

			const request = new XMLHttpRequest();
			request.open("POST", "/pages/editdb.php");
			request.onload = function () {
				console.log(this.response);
			};

			request.send(formData);			
		}    
	}
}

// Moves the sibling to the right
function demoteSibling() {
  if (document.querySelector('.tree .selected')) {
    var chosenChild = document.querySelector('.tree .selected').parentNode,
        youngerChild = chosenChild.nextElementSibling;
    // Does this selected element have anywhere to go?
    if (youngerChild) {
      chosenChild.parentNode.insertBefore(youngerChild,chosenChild);
    }    
  }
}

// Allows the user to rename existing nodes
function editName() {
	var chosenChild = document.querySelector('.tree .selected');

	// Changing root node name not allowed, because of the database technology it needs to have same name as tree itself
	if (chosenChild.parentElement.parentElement.parentElement.className != "tree") {
		chosenChild.setAttribute('contenteditable', 'true');
		chosenChild.focus();
		setCursor(chosenChild);
	}
}

// Go to product editing page
function editItem() {
	var chosenChild  = document.querySelector('.tree .selected'),
		isRoot       = chosenChild.parentElement.parentElement.parentElement.className == "tree";

	// Root node can't be modified.
	if (!isRoot)
		window.location = "/index.php?p=edititem&id=" + chosenChild.id;
}


// Removes the node and it's children
function deleteNode(e) {
  var chosenChild  = document.querySelector('.tree .selected'),
      delButton    = e.target,
      isRoot       = chosenChild.parentElement.parentElement.parentElement.className == "tree";

	var slist = document.querySelectorAll('.tree .selected').length;

	// We assume there is some element with class "tree" on top of our tree in HTML (usually this is div)
	var sroot = chosenChild;
	while (sroot.className != "tree") {
		sroot = sroot.parentElement;
	}

	// Is the user trying to delete the root node?
	if (isRoot) {
		delButton.classList.add('js-root');
		alertRoot.removeAttribute('aria-hidden');
	} else if (delButton.classList.contains('js-confirm')) {
		// Has the user clicked the delete button once already?

		// Is there more than one sibling?
		if (chosenChild.parentNode.parentNode.childElementCount > 1) {
			chosenChild.parentNode.remove();
		} else { // Remove the whole list
			chosenChild.parentNode.parentNode.remove();
		}
		
		deselectNodes();
		hideToolbar();

		// Delete node from database
		const formData = new FormData();

		formData.append("tree", sroot.id);
		formData.append("id", chosenChild.id);
		formData.append("action", "delete");

		const request = new XMLHttpRequest();
		request.open("POST", "/pages/editdb.php");
		request.onload = function () {
			console.log(this.response);
		};

		request.send(formData);
	} else {
		delButton.classList.add('js-confirm');
		alertConfirm.removeAttribute('aria-hidden');
	}
}


// Adds a new node under the current node
function addChild() {
	var topNode = document.querySelector('.tree .selected');
	var sroot = topNode;
	var newNodeName = "Uusi";

	// There has to be some element with class "tree" on top of our tree in HTML (usually this is div)
	while (sroot.className != "tree") {
		sroot = sroot.parentElement;
	}

/*	alert(topNode.classList);
	topNode.classList.remove('selected');
	alert(topNode.classList);*/

	if (topNode) {
		var chosenNode = topNode.parentNode,
        listItem = document.createElement('li');
		
		// The current node already has kids?
		if (chosenNode.querySelector('ul')) {
			var chosenKids = chosenNode.querySelector('ul');
			
			// Add node to database
			const formData = new FormData();

			formData.append("tree", sroot.id);
			formData.append("id", chosenKids.lastElementChild.querySelector('button').id);
			formData.append("name", newNodeName);
			formData.append("action", "addafter");

			const request = new XMLHttpRequest();
			request.open("POST", "/pages/editdb.php");
			request.responseType = "text";

			request.onload = function () {
				listItem.innerHTML = '<button class="button2 selected" aria-pressed="false" data-js="node" contenteditable="true" id=\"' + this.response + '\">' +
					newNodeName + '</button>';
				chosenKids.appendChild(listItem);
				chosenKids.lastChild.querySelector('button').focus();
				setCursor(chosenKids.lastChild.querySelector('button'));
				topNode.classList.remove('selected');
			};

			request.send(formData);
		} else { // The current node has no kids
			// Add node to database
			const formData = new FormData();

			formData.append("tree", sroot.id);
			formData.append("id", topNode.id);
			formData.append("name", newNodeName);
			formData.append("action", "addinside");

			const request = new XMLHttpRequest();
			request.open("POST", "/pages/editdb.php");
			request.onload = function () {
				listItem.innerHTML = '<button type="button" class="button2 selected" aria-pressed="false" data-js="node" contenteditable="true" id=\"' + this.response + '\">' +
					newNodeName + '</button>';
				var newDad = document.createElement('ul');
				newDad.appendChild(listItem);
				chosenNode.appendChild(newDad);
				chosenNode.lastChild.querySelector('button').focus();
				setCursor(chosenNode.lastChild.querySelector('button'));
				topNode.classList.remove('selected');
			};

			request.send(formData);

		}
	}
}

// Because each node is a button tag, the space bar event is captured, when the user is editing.
// This is used as a work-around.
function insertTextAtCursor(text) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}