(() => {

    if (parent !== window && parent !== top) {
        window.workspace_frame_manager = parent.window.workspace_frame_manager;
        return;
    }

    if (rcmail.env.action === ACTION_WORKSPACE_WORKSPACE) return;

    const SIDE_DIV_MAIN_NAME = 'side-workspaces';
    const SIDE_WORKSPACES_SELECTOR = `${CONST_JQUERY_SELECTOR_ID}${SIDE_DIV_MAIN_NAME}`;
    const MAIN_FRAME_NAME = 'workspace-frame';
    const SIDE_FRAMES_NAME = 'side-workspace-';
    const MAX_FRAME_PROPR = 'MAX_FRAMES';
    const MAX_FRAMES = 2;
    const INDEX_NOT_EXIST = -1;
    const STYLE_FRAME = 'position:absolute;width:100%;height:100%;';
    const LAYOUT = `${CONST_JQUERY_SELECTOR_ID}${LAYOUT_MAIN_ID}`;

    class workspace_frame {
        constructor(id, workspace) {
            this._id = id;
            this._frame = null;
            this._active = false;
            this._workspace = workspace;

            this.oncreated = new MelEvent();
        }

        _init() {
            this._id = EMPTY_STRING;
            this._frame = null;
            this._active = false;
            this._workspace = EMPTY_STRING;
            return this;
        }

        _setup(id, workspace) {
            this._id = id;
            this._workspace = workspace;
            return this;
        } 

        show() {
            if (!this._active) {
                this.get().css(CONST_CSS_DISPLAY, EMPTY_STRING);
                this._active = true;
            }

            return this;
        }

        hide() {
            if (this._active) {
                this.get().css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
                this._active = false;
            }

            return this;
        }

        get() {
            if (0 === (this._frame?.length ?? 0)) {
                this._frame = this.create().create(workspace_frame_manager.get_side_workspace());
            }

            return this._frame;
        }

        create() {
            let attribs = {
                id:this._id,
                class:this._id,
                style:STYLE_FRAME
            };
            let iframe = new mel_iframe(this.get_url(), attribs);//new mel_html('iframe', attribs);
            iframe.onload.push((e) => {
                this.oncreated.call(e, this);
            });

            return iframe;
        }

        get_url() {
            return mel_metapage.Functions.url(PLUGIN_WORKSPACE, ACTION_WORKSPACE_WORKSPACE, {
                _uid:this._workspace
            });
        }
    }

    class workspace_frame_manager {
        constructor() {
            this._init();
        }

        _init() {
            /**
             * @type {workspace_frame[]}
             */
            this._frames = [];
            this._current_frame = INDEX_NOT_EXIST;
            this._last_memory = null;

            this.ongobefore = new MelEvent();
            this.ongoafter = new MelEvent();
            this.oncreatebefore = new MelEvent();
            this.oncreated = new MelEvent();
            return this;
        }

        go(wsp) {
            this.ongobefore.call();

            this.hideListFrame();
            if (this.haveFrameInMemory(wsp)) this.showFrame(this._last_memory);
            else this.createFrame(wsp).showFrame(this._last_memory).eraseMemory();

            this.ongoafter.call();
        
            return this;
        }

        goToList() {
            this._current_frame = INDEX_NOT_EXIST;
            this.hideFrames().showListFrame();
            return this;
        }

        haveFrameInMemory(wsp) {
            this._last_memory = this.search(x => wsp === x._workspace);
            return this._last_memory >= 0;
        }

        search(callback) {
            return this._frames.findIndex(callback);
        }

        hideFrames(...exepts) {
            for (let i = 0, len = this._frames.length; i < len; ++i) {
                if (!exepts.includes(i)) {
                    this._frames[i].hide();
                }                
            }

            return this;
        }

        showFrame(index) {
            this.hideFrames(index);
            this._current_frame = index;
            this._frames[index].show();
            return this;
        }

        hideListFrame() {
            $(LAYOUT).css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
            workspace_frame_manager.get_side_workspace().css(CONST_CSS_DISPLAY, EMPTY_STRING);
            return this;
        }

        showListFrame() {
            $(LAYOUT).css(CONST_CSS_DISPLAY, EMPTY_STRING);
            workspace_frame_manager.get_side_workspace().css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
            return this;
        }

        eraseMemory() {
            if (null !== this._last_memory) this._last_memory = null;
            return this;
        }

        getActiveFrame() {
            if (INDEX_NOT_EXIST !== this._current_frame) {
                return this._frames[this._current_frame];
            }

            return null;
        }

        /**
         * Créer une frame
         * @param {string} wsp 
         * @returns {workspace_frame_manager}
         */
        createFrame(wsp) {
            if (this._frames.length >= workspace_frame_manager.MAX_FRAMES) {
                this._frames.pop();
                return this.createFrame(wsp);
            }
            else {
                this.oncreatebefore.call();

                let id = this._frames.length;
                while (0 !== $(`${CONST_JQUERY_SELECTOR_ID}${SIDE_FRAMES_NAME}${id}`).length) {
                    ++id;

                    if (id >= 500) {
                        throw `id ${id} cannot exist`;
                    }
                }

                id = new workspace_frame(`${SIDE_FRAMES_NAME}${id}`, wsp);
                id.oncreated.push((event, iframe) => {
                    this.oncreated.call(event, iframe, this);
                });
                this._frames.unshift(id);
                this._last_memory = 0;
            }

            return this;
        }

        static create_side_workspaces($parent = $('body')) {
            return mel_html.div({
                id:SIDE_DIV_MAIN_NAME,
                class:SIDE_DIV_MAIN_NAME,
                style:STYLE_FRAME
            }).create($parent);
        }

        static get_side_workspace() {
            let $querry = $(SIDE_WORKSPACES_SELECTOR);

            if (0 === $querry.length) $querry = this.create_side_workspaces()

            return $querry;
        }
    }

    Object.defineProperty(workspace_frame_manager, MAX_FRAME_PROPR, {
        enumerable: false,
        configurable: false,
        writable: false,
        value:MAX_FRAMES
    });

    window.workspace_frame_manager = new workspace_frame_manager();
    
    Object.defineProperty(window.workspace_frame_manager, MAX_FRAME_PROPR, {
        enumerable: false,
        configurable: false,
        writable: false,
        value:workspace_frame_manager.MAX_FRAMES
    });
    
})();