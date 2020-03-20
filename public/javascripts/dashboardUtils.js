const sidebar = document.getElementsByClassName('sidebar')[0];
const dashbordContent = document.getElementsByClassName('dashboard-workspace')[0];
const dashBoardWorkspaceTextarea = document.getElementsByClassName('dashboard-workspace-textarea')[0];
const saveButton = document.getElementsByClassName('.save-button')[0];
let noteTitleField;

// ============================= FUNCTIONS FOR FETCHING DATA/INTERACTING WITH THE BACKEND ===========================

// GET note content
function getContent(ev) {
    const noteTitle = ev.target.textContent;
    const collectionTitle = ev.target.parentElement.querySelector('.sidebar-container-heading').textContent.trim();
    axios.get(`/api/note/${collectionTitle}/${noteTitle}`)
        .then(displayNote).catch(function (err) {
        console.log(err.response.status || 'Status unknown.', err.response.data || 'There was a problem.');
    });
}

// ADD note to collection
function addNote(ev) {
    const container = ev.parentElement.parentElement.parentElement;
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    const form = new FormData();
    form.append('collectionTitle', collectionTitle);
    // Set the title of the new note to be "New Note(<number>)"
    let newNoteIndex = 0;
    for (let elem of container.querySelectorAll('.sidebar-container-element')) {
        if (elem.textContent.trim().match(/^New Note\([0-9]*\)$/)) {
            let x = parseInt(elem.textContent.trim().slice(1 + elem.textContent.trim().indexOf('('),
                elem.textContent.trim().indexOf(')')));
            if (newNoteIndex < x) {
                newNoteIndex = x;
            }
        }
    }
    form.append('noteTitle', `New Note(${newNoteIndex + 1})`);
    axios.post('/api/note/add', form)
        .then(function (response) {
            addNoteToContainer(response.data.note, container);
        }).catch(function (err) {
        console.log(err.response.data.msg || 'There was a problem.');
    });

}

// UPDATE a note when the save button is clicked
function updateNote() {
    if (noteTitleField.value === "") {
        alert('Note title cannot be empty.');
        return;
    }
    let form = new FormData();
    form.append('noteTitle', JSON.parse(sessionStorage.getItem('currentNote')).title);
    form.append('collectionTitle', JSON.parse(sessionStorage.getItem('currentNote')).collectionTitle);
    form.append('newNoteTitle', noteTitleField.value);
    form.append('newNoteContent', dashBoardWorkspaceTextarea.value || "");
    axios.post('/api/note/update', form)
        .then(function (response) {
            //    what to do after saving a note
            alert('Saved!');
        }).catch(function (err) {
        console.log(err.response.data.msg || 'There was a problem.');
    });
}

// DELETE an entire collection, including the notes inside
function deleteCollection(ev) {
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    let form = new FormData();
    form.append('collectionTitle', collectionTitle);
    axios.post('/api/collection/delete', form)
        .then(function (response) {
            //TODO: de adaugat animatia stergerii colectiei
            ev.parentElement.parentElement.parentElement.style.display = 'none';
        }).catch(function (err) {
        console.log(err.response.data.msg || 'There was a problem.');
    });
}

// Initialize dashboard
axios.get('/api/user/collections?includeCollaborations=true')
    .then(initializeDashboard).catch(function (err) {
    console.log(err);
    alert(err.response.data.msg || 'There was a problem.');
});

// ========================= FUNCTIONS FOR DISPLAYING DATA ======================

// DISPLAY note content
function displayNote(response) {
    sessionStorage.setItem('currentNote', JSON.stringify(response.data.note));
    dashBoardWorkspaceTextarea.value = JSON.parse(sessionStorage.getItem('currentNote')).content;
}

function initializeDashboard(response) {
    for (let col of response.data.collections) {
        let container = document.createElement('div');
        container.classList.add('sidebar-container');
        container.classList.add('animate');

        let containerHeading = document.createElement('div');
        containerHeading.classList.add('sidebar-container-heading');
        containerHeading.textContent = col.title;
        let containerTools = document.createElement('div');
        containerTools.classList.add('sidebar-container-tools');
        containerTools.innerHTML = '<i class="fas fa-plus" onclick="addNote(this)"></i>' +
            '<i class="fas fa-trash" onclick="deleteCollection(this)"></i>';
        containerHeading.appendChild(containerTools);
        container.appendChild(containerHeading);

        for (let note of col.notes) {
            addNoteToContainer(note, container);
        }
        sidebar.appendChild(container);
    }
}

function addNoteToContainer(note, container) {
    let containerElement = document.createElement('div');
    containerElement.classList.add('sidebar-container-element');
    containerElement.textContent = note.title;
    containerElement.onclick = getContent;
    container.appendChild(containerElement);
}
