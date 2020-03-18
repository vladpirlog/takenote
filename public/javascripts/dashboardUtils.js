const sidebar = document.getElementsByClassName('sidebar')[0];
const dashbordContent = document.getElementsByClassName('dashboard-workspace')[0];

// DISPLAY note content
function displayContent(ev) {
    const noteTitle = ev.target.textContent;
    const collectionTitle = ev.target.parentElement.querySelector('.sidebar-container-heading').textContent.trim();
    axios.get(`/api/note/${collectionTitle}/${noteTitle}`)
        .then(displayNote).catch(function (err) {
        console.log(err.response.status || 'Status unknown.', err.response.data || 'There was a problem.');
    });
}

// ADD note to collection
function addNote(ev) {
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
}

function deleteCollection(ev) {
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    let form = new FormData();
    form.append('collectionTitle', collectionTitle);
    axios.post('/api/collection/delete', form)
        .then(function (response) {
            //TODO: de adaugat animatia stergerii colectiei
            ev.parentElement.parentElement.parentElement.style.display = 'none';
        }).catch(function (err) {

    });
}

// Initialize dashboard
axios.get('/api/user/collections?includeCollaborations=true')
    .then(initializeDashboard).catch(function (err) {
    console.log(err);
    alert(err.response.data.msg || 'There was a problem.');
});

function displayNote(response) {
    dashbordContent.textContent = response.data.note.content;
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
            let containerElement = document.createElement('div');
            containerElement.classList.add('sidebar-container-element');
            containerElement.textContent = note.title;
            containerElement.onclick = displayContent;
            container.appendChild(containerElement);
        }
        sidebar.appendChild(container);
    }
}
