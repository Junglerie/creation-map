function foo() {
    WA.ui.openPopup(
        "my_popup", // name of the rectangle object (see below)
        "Foo message to be shown.", // popup message
        [] //empty array for no buttons
    );
}

function bar() {
    WA.ui.openPopup(
        "my_popup", // name of the rectangle object (see below)
        "Bar message to be shown.", // popup message
        [
            {
                label: "Button1", // text of button 1
                className: "primary", // css class, here for primary buttons
                callback: (p) => { // place for a callback
                    p.close(); // for example closing the popup
                }
            }, {
            label: "Button2", // text of button 2
            className: "normal", // css class, here for normal buttons
            callback: (p) => {
                p.close();
            }
        },
        ]
    );
}