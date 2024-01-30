### Message Board: API Documentation


*   **POST**

    post a thread to a specific message board by passing form data _"text"_ and _"delete_password"_

    `/api/threads/{board}`
*   **POST**

    post a reply to a thead on a specific board by passing form data

    `{"thread_id": "example thread id", "text": "example text", "delete_password": "example del password"}` to `/api/replies/{board}` In the thread's 'replies' array an object will be saved as `{"_id": "5bc21538c79be716620fb574", "created_on": "2018-10-13T15:54:32.198Z", "text": "test"}`
*   **GET**

    an array of the most recent 10 threads on the board with only the most recent 3 replies from

    `/api/threads/{board}`
*   **GET**

    get an entire thread with all it's replies from

    `/api/replies/{board}?thread_id={thread_id}`
*   **DELETE**

    delete a thread completely, by sending a form data with _"thread_id"_ and _"delete_password"_ to

    `/api/threads/{board}` Returns a text response if successful as _'success'_ else if password is wrong_'incorrect password'_
*   **DELETE**

    To delete a comment post send form data containing _"thread_id"_, _"reply_id"_, _"delete_password"_ to

    `/api/replies/{board}` Returns a text response if successful as _'success'_ else if password is wrong_'incorrect password'_
*   **PUT**

    report a thread by sending form data containing _"thread_id"_ to

    `/api/threads/{board}` if successful returns text response _'success'_
*   **PUT**

    To report a reply send form data containing _"thread_id"_ and _"reply_id"_ to

    `/api/replies/{board}` if successful returns text response _'success'_

#### Example Board:  [_/b/general/_](https://a-message-board.glitch.me/b/general/)

For more information visit: [_https://a-message-board.glitch.me/_](https://a-message-board.glitch.me/)
* * *