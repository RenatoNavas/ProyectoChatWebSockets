let form_login = document.getElementById('form_login');
let chat_div = document.getElementById('chat_div');
let write_message_form = document.getElementById('write_message_form');
var stompClient = null;
let username = '';
// TODO: add scroll down automatically and prevent it if user scrolls to up
// For scroll down content
// let freeze_scroll = false;
// let messages_area = document.getElementById('messages_area');
// messages_area.addEventListener('scroll', (e)=>{
// });

// For login
form_login.addEventListener('submit', submitLogin, true);

function submitLogin(e) {
    username = document.getElementById('username').value.trim();

    if (username != '') {
        document.getElementById('form_login').classList.add('d-none');
        document.getElementById('chat_div').classList.remove('d-none');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }

    e.preventDefault();
}

function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({ sender: username, type: 'JOIN' })
    )
}

function onError(error) {
    console.error('Could not connect, please try again');
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    if (message.type === 'JOIN') {
        let html = `
        <li style="text-align: center; color: #606060;">
            <p>${message.sender} joined!</p>
        </li>
        <li id="new_message"></li>
        `;
        document.getElementById('new_message').outerHTML = html;

    } else if (message.type === 'LEAVE') {
        let html = `
        <li style="text-align: center; color: #606060;">
            <p>${message.sender} left!</p>
        </li>
        <li id="new_message"></li>
        `;
        document.getElementById('new_message').outerHTML = html;
    } else {
        // Code for format date
        const dateTime = new Date(message.dateTime);

        const formattedDateTime = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(dateTime);

        if (message.sender == username) {
            let html = `
            <li class="repaly">
                <p>${message.content}</p>
                <span class="time">${formattedDateTime}</span>
            </li>
            <li id="new_message"></li>
            `;
            document.getElementById('new_message').outerHTML = html;
        }
        else {
            let html = `
            <ul>
                <span class="" style="font-size: 0.9rem">
                ${message.sender}
                </span>
                <li class="sender" style="margin-left: 60px;">
                    <p> ${message.content} </p>
                    <span class="time">${formattedDateTime}</span>
                </li>
            </ul>
            <li id="new_message"></li>
            `;
            document.getElementById('new_message').outerHTML = html;
        }
    }

}

write_message_form.addEventListener('submit', sendMessage, true);

function sendMessage(e) {
    let message = document.getElementById('message_content');
    let messageContent = message.value.trim();
    if (messageContent != '' && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        message.value = '';
    }
    e.preventDefault();
}
