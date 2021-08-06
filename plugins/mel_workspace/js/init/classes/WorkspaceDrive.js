class WorkspaceDriveTree{
    constructor(datas = {tree:{}, parentMetadatas:{}})
    {
        this.init();
        this.setup(datas);
    }

    init()
    {
        this.tree = {};
        this.parentMetadatas = {};
    }

    setup(datas = {tree:{}, parentMetadatas:{}})
    {
        this.tree = datas.tree;
        this.parentMetadatas = datas.parentMetadatas;
        //console.log("l",this);
    }

    addOrUpdateRange(wsp, datas)
    {
        if (this.tree[wsp] === undefined)
            this.tree[wsp] = {}

        for (const key in datas) {
            if (Object.hasOwnProperty.call(datas, key)) {
                const element = datas[key];
                this.tree[wsp][element.path] = element;
            }
        }
    }
    
    addParentMetadata(wsp, metadatas)
    {
        this.parentMetadatas[wsp] = metadatas;
    }

    getFolder(wsp, path)
    {
        //wsp/document
        let datas;
        if (path === null)
            datas = Enumerable.from(this.tree[wsp]).where(x => !x.key.includes(`/`)).select(x => x.value).toArray();
        else
            datas = Enumerable.from(this.tree[wsp]).where(x => x.value.dirname === path).select(x => x.value).toArray();

        return datas;
    }

    getFolders(wsp, ...addedPaths)
    {
        //console.log("folders", wsp, addedPaths);
        if (this.tree[wsp] === undefined)
            return [];
        return Enumerable.from(this.tree[wsp]).where(x => x.value.type === "dir").select(x => x.value).concat(addedPaths).orderBy(x => x.path.split("/").length).toArray();
    }

    
}