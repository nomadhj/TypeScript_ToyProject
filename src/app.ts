let prjId = 1;
let currentDragItem: DragItem;

type DragItem = "item" | "projectList";
type InsertPos = "afterbegin" | "beforebegin" | "afterend" | "beforeend";

// 드래그 앤 드롭 인터페이스
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

// 상속 구현을 위한 추상 클래스(제네릭 구현)
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertPos: InsertPos,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    ) as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId) as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertPos);
  }

  private attach(position: InsertPos) {
    this.hostElement.insertAdjacentElement(position, this.element);
  }

  abstract configure(): void;
}

// 프로젝트 아이템
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  constructor(
    private hostId: string,
    private content: string,
    private listId: number
  ) {
    super("projectItem", hostId, "beforeend");
    this.element.innerHTML = `${this.content} <button>X</button>`;
    this.element.id = Math.random().toFixed(3).toString();
    this.element.dataset.category = `${this.listId}`;
    this.element.style.backgroundColor = this.randomColor();

    this.configure();
  }

  dragStartHandler(event: DragEvent) {
    event.stopPropagation();
    currentDragItem = "item";
    const pickedNode = this.element;
    const pickedNodeList = [...pickedNode.parentNode!.children];
    const pickedNodeIndex = pickedNodeList.indexOf(pickedNode);
    event.dataTransfer!.setData(
      "text/plain",
      `item,${pickedNode.dataset.category},${pickedNodeIndex},${pickedNode.id}`
    );
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler(_: DragEvent) {}

  private closeHandler(event: Event) {
    const closeBtnNode = event.target as HTMLButtonElement;
    const targetNode = closeBtnNode.parentNode as HTMLLIElement;
    const itemWrapper = targetNode.parentNode as HTMLUListElement;
    itemWrapper.removeChild(targetNode);
  }

  configure() {
    const closeBtnElement = this.element.querySelector("button");
    closeBtnElement!.addEventListener("click", this.closeHandler.bind(this));
    this.element.addEventListener(
      "dragstart",
      this.dragStartHandler.bind(this)
    );
    this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
  }

  private randomColor(): string {
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

// 프로젝트 리스트
class ProjectList
  extends Component<HTMLElement, HTMLElement>
  implements Draggable, DragTarget
{
  InputElement: HTMLInputElement;

  constructor(private id: number, private title: string) {
    super("projectList", "project-wrapper", "beforeend", `project${id}`);
    this.element.id = `project${id}`;
    this.element.querySelector("h2")!.textContent = this.title;
    this.element.querySelector("ul")!.id = `itemList${id}`;
    this.InputElement = this.element.querySelector("input") as HTMLInputElement;

    this.configure();
  }

  dragStartHandler(event: DragEvent) {
    currentDragItem = "projectList";
    const pickedNode = this.element;
    const pickedNodeList = [...pickedNode.parentNode!.children];
    const pickedNodeIndex = pickedNodeList.indexOf(pickedNode);
    event.dataTransfer!.setData(
      "text/plain",
      `projectList,${pickedNodeIndex},${pickedNode.id}`
    );
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler(_: DragEvent) {}

  // Todo: 쓰로틀링이나 디바운싱 적용 가능한지 검토
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      let targetNode = event.target as HTMLElement;

      if (currentDragItem === "item" && targetNode.tagName === "LI") {
        targetNode.classList.add("droppable");
      } else if (currentDragItem === "projectList") {
        this.element.classList.add("droppable");
      }
    }
  }

  dropHandler(event: DragEvent) {
    const dataList = event.dataTransfer!.getData("text/plain").split(",");
    let targetNode = event.target as HTMLElement;

    if (dataList[0] === "item" && targetNode.tagName === "LI") {
      this.compareItem(event, targetNode, dataList);
    } else if (dataList[0] === "projectList") {
      this.compareProject(event, targetNode, dataList);
    }
  }

  dragLeaveHandler(event: DragEvent) {
    let targetNode = event.target as HTMLElement;

    if (currentDragItem === "item" && targetNode.tagName === "LI") {
      targetNode.classList.remove("droppable");
    } else if (currentDragItem === "projectList") {
      this.element.classList.remove("droppable");
    }
  }

  private compareItem(event: DragEvent, node: HTMLElement, dataList: string[]) {
    const [_, category, pickedNodeIndex, pickedNodeId] = dataList;
    const pickedNode = document.getElementById(pickedNodeId)!;

    if (category === node.dataset.category) {
      const nodeList = [...node.parentNode!.children];
      const nodeIndex = nodeList.indexOf(node);

      if (+pickedNodeIndex > nodeIndex) node.before(pickedNode);
      else node.after(pickedNode);
    } else {
      const dropY = event.offsetY;
      const height = node.clientHeight;

      if (dropY <= height / 2) node.before(pickedNode);
      else node.after(pickedNode);

      pickedNode.dataset.category = node.dataset.category;
    }
    this.dragLeaveHandler(event);
  }

  private compareProject(
    event: DragEvent,
    node: HTMLElement,
    dataList: string[]
  ) {
    const [_, pickedNodeIndex, pickedNodeId] = dataList;
    const pickedNode = document.getElementById(pickedNodeId)!;

    while (node.tagName !== "SECTION") {
      node = node.parentNode as HTMLElement;
    }

    const nodeList = [...node.parentNode!.children];
    const nodeIndex = nodeList.indexOf(node);

    if (+pickedNodeIndex > nodeIndex) node.before(pickedNode);
    else node.after(pickedNode);

    this.dragLeaveHandler(event);
  }

  private closeHandler(event: Event) {
    const closeBtnNode = event.target as HTMLElement;
    const targetNode = closeBtnNode.parentNode!.parentNode as HTMLElement;
    const projectWrapper = document.getElementById(
      "project-wrapper"
    ) as HTMLDivElement;
    projectWrapper.removeChild(targetNode);
  }

  private validate(validateInput: string): boolean {
    let isValid = true;
    return isValid && validateInput.trim().length !== 0;
  }

  private submithandler(event: Event) {
    event.preventDefault();
    const inputValue = this.InputElement.value;

    if (this.validate(inputValue)) {
      new ProjectItem(`itemList${this.id}`, inputValue, this.id);
      this.InputElement.value = "";
    } else {
      alert("카드 내용을 입력해주세요.");
    }
  }

  configure() {
    const closeBtnElement = this.element.querySelector("button");
    const submitFormElement = this.element.querySelector(".addItems");
    closeBtnElement!.addEventListener("click", this.closeHandler.bind(this));
    submitFormElement!.addEventListener(
      "submit",
      this.submithandler.bind(this)
    );
    this.element.addEventListener(
      "dragstart",
      this.dragStartHandler.bind(this)
    );
    this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
    this.element.addEventListener("dragover", this.dragOverHandler.bind(this));
    this.element.addEventListener("drop", this.dropHandler.bind(this));
    this.element.addEventListener(
      "dragleave",
      this.dragLeaveHandler.bind(this)
    );
  }
}

// 프로젝트 리스트 생성 입력 Form
class ProjectAdd extends Component<HTMLDivElement, HTMLFormElement> {
  InputElement: HTMLInputElement;

  constructor() {
    super("projectAdd", "app", "beforeend", "userInput");
    this.InputElement = this.element.querySelector(
      "#projectTitle"
    ) as HTMLInputElement;

    this.configure();
  }

  private validate(validateInput: string): boolean {
    let isValid = true;
    return isValid && validateInput.trim().length !== 0;
  }

  private submithandler(event: Event) {
    event.preventDefault();
    const inputValue = this.InputElement.value;

    if (this.validate(inputValue)) {
      new ProjectList(prjId++, inputValue);
      this.InputElement.value = "";
    } else {
      alert("프로젝트 이름을 입력해주세요.");
    }
  }

  configure() {
    this.element.addEventListener("submit", this.submithandler.bind(this));
  }
}

const addPrj = new ProjectAdd();
