let projectId = 1;

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

// 프로젝트 타입
enum ProjectStatus {
  Active,
  Finished,
}
class Project {
  constructor(
    public id: number,
    // public title: string,
    // public description: string,
    // public people: number,
    public status: ProjectStatus
  ) {}
}

type Listener<T> = (items: T[]) => void;

// 스테이트 베이스 클래스
class State<T> {
  protected listners: Listener<T>[] = [];

  addListner(listnerFn: Listener<T>) {
    this.listners.push(listnerFn);
  }
}

// 프로젝트 관리를 위한 클래스 (싱글톤 패턴; 단 하나의 인스턴스만을 생성하는 클래스)
class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  // addProject(title: string, description: string, numOfPeople: number) {
  //   const newProject = new Project(
  //     projectId++,
  //     title,
  //     description,
  //     numOfPeople,
  //     ProjectStatus.Active
  //   );
  //   this.projects.push(newProject);
  //   this.updateListners();
  // }

  addProject() {
    const newProject = new Project(
      projectId++,
      // title,
      // description,
      // numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListners();
  }

  moveProject(projectId: number, newStatus: ProjectStatus) {
    const project = this.projects.find((prj) => prj.id === projectId);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListners();
    }
  }

  private updateListners() {
    for (const listnerFn of this.listners) {
      listnerFn([...this.projects]);
    }
  }
}

const projectState = ProjectState.getInstance();

// 유효성 검증을 위한 함수
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null && // null과 undefined 모두 걸러내기 위해 !=를 사용
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}

// autobind 데코레이터
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}
// 컴포넌트 베이스 클래스(인스턴스화가 불가능하도록 추상클래스로 설정)
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// 단일 프로젝트 항목 관리 클래스
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project;

  // get persons() {
  //   if (this.project.people === 1) {
  //     return "1 person";
  //   } else {
  //     return `${this.project.people} persons`;
  //   }
  // }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id.toString());
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    const pickedNode = event.target as HTMLElement;
    const pickedNodeList = [...pickedNode.parentNode!.children];
    const pickedNodeIndex = pickedNodeList.indexOf(pickedNode);

    // event.dataTransfer!.setData("text/plain", this.project.id.toString());
    event.dataTransfer!.setData("text/plain", pickedNodeIndex.toString());
    event.dataTransfer!.effectAllowed = "move"; // copymove가 아닌 move 사용
  }

  @autobind
  dragEndHandler(_: DragEvent) {}

  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }

  renderContent() {
    // this.element.textContent = this.project.title;
    // this.element.querySelector("h2")!.textContent = this.project.title;
    // this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    // this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// 렌더링 될 프로젝트 리스트를 다루는 클래스
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault(); // 기본적으로 drop을 막으므로 해제
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
    // const prjId = +event.dataTransfer!.getData("text/plain");
    // projectState.moveProject(
    //   prjId,
    //   this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    // );

    const pickedNodeIndex = +event.dataTransfer!.getData("text/plain");
    const targetNode = event.target as HTMLElement; // 드롭위치의 노드
    const targetNodeList = [...targetNode.parentNode!.children];
    const targetNodeIndex = targetNodeList.indexOf(targetNode);

    if (pickedNodeIndex > targetNodeIndex) {
      targetNode.before(targetNodeList[pickedNodeIndex]);
    } else {
      targetNode.after(targetNodeList[pickedNodeIndex]);
    }
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler, true);
    projectState.addListner((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        } else if (this.type === "finished") {
          return prj.status === ProjectStatus.Finished;
        }
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    listEl.innerHTML = ""; // listEl의 모든 내용을 없애고 새로 렌더링 : 이렇게 하지 않으면 프로젝트 추가 시 기존꺼도 중복되어 추가 됨, 최적화 할 방법은 없는지
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }
}

// 입력값을 다루는 클래스
// class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
//   titleInputElement: HTMLInputElement;
//   descriptionInputElement: HTMLTextAreaElement;
//   peopleInputElement: HTMLInputElement;

//   constructor() {
//     super("project-input", "app", true, "user-input");
//     this.titleInputElement = this.element.querySelector(
//       "#title"
//     ) as HTMLInputElement;
//     this.descriptionInputElement = this.element.querySelector(
//       "#description"
//     ) as HTMLTextAreaElement;
//     this.peopleInputElement = this.element.querySelector(
//       "#people"
//     ) as HTMLInputElement;

//     this.configure();
//   }

//   configure() {
//     this.element.addEventListener("submit", this.submitHandler);
//   }

//   renderContent() {}

//   private gatherUserInput(): [string, string, number] | void {
//     const enteredTitle = this.titleInputElement.value;
//     const enteredDescription = this.descriptionInputElement.value;
//     const enteredPeople = this.peopleInputElement.value;

//     const titleValidatable: Validatable = {
//       value: enteredTitle,
//       required: true,
//     };
//     const descriptionValidatable: Validatable = {
//       value: enteredDescription,
//       required: true,
//       minLength: 1,
//     };
//     const peopleValidatable: Validatable = {
//       value: +enteredPeople,
//       required: true,
//       min: 1,
//     };

//     if (
//       !validate(titleValidatable) ||
//       !validate(descriptionValidatable) ||
//       !validate(peopleValidatable)
//     ) {
//       alert("Invalid Input, Please try agian!!");
//       return;
//     } else {
//       return [enteredTitle, enteredDescription, +enteredPeople];
//     }
//   }

//   private clearInputs() {
//     this.titleInputElement.value = "";
//     this.descriptionInputElement.value = "";
//     this.peopleInputElement.value = "";
//   }

//   @autobind
//   private submitHandler(event: Event) {
//     event.preventDefault();
//     const userInput = this.gatherUserInput();
//     if (Array.isArray(userInput)) {
//       const [title, desc, people] = userInput;
//       projectState.addProject(title, desc, people);
//       this.clearInputs();
//     }
//   }
// }

// 프로젝트 추가 클래스

class ProjectAdd extends Component<HTMLDivElement, HTMLDivElement> {
  constructor() {
    super("project-add", "app", true, "user-project");

    this.configure();
  }

  configure() {
    this.element.addEventListener("click", this.clickHandler.bind(this));
  }

  renderContent() {}

  private clickHandler() {
    console.log("hello");
    projectState.addProject();
  }
}

const userPrj = new ProjectAdd();
// const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
// const finishedPrjList = new ProjectList("finished");
