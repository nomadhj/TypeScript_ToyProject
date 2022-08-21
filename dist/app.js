"use strict";
let prjId = 1;
let currentDragItem;
class Component {
    constructor(templateId, hostElementId, insertPos, newElementId) {
        this.templateElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertPos);
    }
    attach(position) {
        this.hostElement.insertAdjacentElement(position, this.element);
    }
}
class ProjectItem extends Component {
    constructor(hostId, content, listId) {
        super("projectItem", hostId, "beforeend");
        this.hostId = hostId;
        this.content = content;
        this.listId = listId;
        this.element.innerHTML = `${this.content} <button>X</button>`;
        this.element.id = Math.random().toFixed(3).toString();
        this.element.dataset.category = `${this.listId}`;
        this.element.style.backgroundColor = this.randomColor();
        this.configure();
    }
    dragStartHandler(event) {
        event.stopPropagation();
        currentDragItem = "item";
        const pickedNode = this.element;
        const pickedNodeList = [...pickedNode.parentNode.children];
        const pickedNodeIndex = pickedNodeList.indexOf(pickedNode);
        event.dataTransfer.setData("text/plain", `item,${pickedNode.dataset.category},${pickedNodeIndex},${pickedNode.id}`);
        event.dataTransfer.effectAllowed = "move";
    }
    dragEndHandler(_) { }
    closeHandler(event) {
        const closeBtnNode = event.target;
        const targetNode = closeBtnNode.parentNode;
        const itemWrapper = targetNode.parentNode;
        itemWrapper.removeChild(targetNode);
    }
    configure() {
        const closeBtnElement = this.element.querySelector("button");
        closeBtnElement.addEventListener("click", this.closeHandler.bind(this));
        this.element.addEventListener("dragstart", this.dragStartHandler.bind(this));
        this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
    }
    randomColor() {
        switch (Math.floor(Math.random() * 10)) {
            case 0:
                return "rgb(96, 189, 78)";
            case 1:
                return "rgb(241, 214, 0)";
            case 2:
                return "rgb(255, 158, 25)";
            case 3:
                return "rgb(235, 90, 70)";
            case 4:
                return "rgb(178, 186, 197)";
            case 5:
                return "rgb(1, 121, 191)";
            case 6:
                return "rgb(0, 194, 223)";
            case 7:
                return "rgb(81, 232, 152)";
            case 8:
                return "rgb(255, 120, 203)";
            case 9:
            default:
                return "rgb(194, 200, 209)";
        }
    }
}
class ProjectList extends Component {
    constructor(id, title) {
        super("projectList", "project-wrapper", "beforeend", `project${id}`);
        this.id = id;
        this.title = title;
        this.element.id = `project${id}`;
        this.element.querySelector("h2").textContent = this.title;
        this.element.querySelector("ul").id = `itemList${id}`;
        this.InputElement = this.element.querySelector("input");
        this.configure();
    }
    dragStartHandler(event) {
        currentDragItem = "projectList";
        const pickedNode = this.element;
        const pickedNodeList = [...pickedNode.parentNode.children];
        const pickedNodeIndex = pickedNodeList.indexOf(pickedNode);
        event.dataTransfer.setData("text/plain", `projectList,${pickedNodeIndex},${pickedNode.id}`);
        event.dataTransfer.effectAllowed = "move";
    }
    dragEndHandler(_) { }
    dragOverHandler(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
            event.preventDefault();
            let targetNode = event.target;
            if (currentDragItem === "item" && targetNode.tagName === "LI") {
                targetNode.classList.add("droppable");
            }
            else if (currentDragItem === "projectList") {
                this.element.classList.add("droppable");
            }
        }
    }
    dropHandler(event) {
        const dataList = event.dataTransfer.getData("text/plain").split(",");
        let targetNode = event.target;
        if (dataList[0] === "item" && targetNode.tagName === "LI") {
            this.compareItem(event, targetNode, dataList);
        }
        else if (dataList[0] === "projectList") {
            this.compareProject(event, targetNode, dataList);
        }
    }
    dragLeaveHandler(event) {
        let targetNode = event.target;
        if (currentDragItem === "item" && targetNode.tagName === "LI") {
            targetNode.classList.remove("droppable");
        }
        else if (currentDragItem === "projectList") {
            this.element.classList.remove("droppable");
        }
    }
    compareItem(event, node, dataList) {
        const [_, category, pickedNodeIndex, pickedNodeId] = dataList;
        const pickedNode = document.getElementById(pickedNodeId);
        if (category === node.dataset.category) {
            const nodeList = [...node.parentNode.children];
            const nodeIndex = nodeList.indexOf(node);
            if (+pickedNodeIndex > nodeIndex)
                node.before(pickedNode);
            else
                node.after(pickedNode);
        }
        else {
            const dropY = event.offsetY;
            const height = node.clientHeight;
            if (dropY <= height / 2)
                node.before(pickedNode);
            else
                node.after(pickedNode);
            pickedNode.dataset.category = node.dataset.category;
        }
        this.dragLeaveHandler(event);
    }
    compareProject(event, node, dataList) {
        const [_, pickedNodeIndex, pickedNodeId] = dataList;
        const pickedNode = document.getElementById(pickedNodeId);
        while (node.tagName !== "SECTION") {
            node = node.parentNode;
        }
        const nodeList = [...node.parentNode.children];
        const nodeIndex = nodeList.indexOf(node);
        if (+pickedNodeIndex > nodeIndex)
            node.before(pickedNode);
        else
            node.after(pickedNode);
        this.dragLeaveHandler(event);
    }
    closeHandler(event) {
        const closeBtnNode = event.target;
        const targetNode = closeBtnNode.parentNode.parentNode;
        const projectWrapper = document.getElementById("project-wrapper");
        projectWrapper.removeChild(targetNode);
    }
    validate(validateInput) {
        let isValid = true;
        return isValid && validateInput.trim().length !== 0;
    }
    submithandler(event) {
        event.preventDefault();
        const inputValue = this.InputElement.value;
        if (this.validate(inputValue)) {
            new ProjectItem(`itemList${this.id}`, inputValue, this.id);
            this.InputElement.value = "";
        }
        else {
            alert("카드 내용을 입력해주세요.");
        }
    }
    configure() {
        const closeBtnElement = this.element.querySelector("button");
        const submitFormElement = this.element.querySelector(".addItems");
        closeBtnElement.addEventListener("click", this.closeHandler.bind(this));
        submitFormElement.addEventListener("submit", this.submithandler.bind(this));
        this.element.addEventListener("dragstart", this.dragStartHandler.bind(this));
        this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
        this.element.addEventListener("dragover", this.dragOverHandler.bind(this));
        this.element.addEventListener("drop", this.dropHandler.bind(this));
        this.element.addEventListener("dragleave", this.dragLeaveHandler.bind(this));
    }
}
class ProjectAdd extends Component {
    constructor() {
        super("projectAdd", "app", "beforeend", "userInput");
        this.InputElement = this.element.querySelector("#projectTitle");
        this.configure();
    }
    validate(validateInput) {
        let isValid = true;
        return isValid && validateInput.trim().length !== 0;
    }
    submithandler(event) {
        event.preventDefault();
        const inputValue = this.InputElement.value;
        if (this.validate(inputValue)) {
            new ProjectList(prjId++, inputValue);
            this.InputElement.value = "";
        }
        else {
            alert("프로젝트 이름을 입력해주세요.");
        }
    }
    configure() {
        this.element.addEventListener("submit", this.submithandler.bind(this));
    }
}
const addPrj = new ProjectAdd();
//# sourceMappingURL=app.js.map