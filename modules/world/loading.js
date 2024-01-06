class ContentLoadingManager {
    constructor() {
        this.numLoading = 0;
    }
    
    addItem() {
        ++this.numLoading;
    }

    removeItem() {
        --this.numLoading;
    }

    isLoading() {
        return this.numLoading != 0;
    }

    wait(cb) {
        let self = this;
        console.log("[loading] Waiting for " + this.numLoading + " item(s).");
        new Promise(function(resolve) {
            function doCheck() {
                if(self.isLoading()) {
                    setTimeout(doCheck, 200);
                }
                else {
                    resolve();
                }
            }

            doCheck();
        }).then(() => {
            console.log("[loading] Completed.  Executing callback ...");
            cb();
        });
    }
}

let loading = new ContentLoadingManager();

function GetContentLoadingManager() {
    return loading;
}

export {GetContentLoadingManager};