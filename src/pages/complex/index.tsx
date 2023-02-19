import React from "react";
import "./index.scss";
import Output from "../../components/output";
import { getinput, uuid } from "../../util";
import { fetchChatGPT } from "../../api";
import { EIdentity, TtextList } from "../../type";
import axios from "axios";
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const CHATLIST = "CHATLIST";

type IChatList = Array<{
  title: string;
  id: string;
  textList: TtextList;
}>;
type IState = {
  isSpeak: boolean;
  inputValue: string;
  isLoading: boolean;
  chatList: IChatList;
  selectChat: string;
};

class App extends React.Component<{}, IState> {
  recognition: any;
  synth: SpeechSynthesis | undefined;
  constructor(props: any) {
    super(props);
    this.state = {
      isSpeak: false,
      inputValue: "",
      isLoading: false,
      chatList: [],
      selectChat: "",
    };
  }

  componentDidMount(): void {
    this.init();
    document.addEventListener("keypress", this.handleKeyPress);
  }

  init = () => {
    const storageChatList = JSON.parse(localStorage.getItem(CHATLIST));
    try {
      if (storageChatList.length) {
        this.setState({
          chatList: storageChatList,
          selectChat: storageChatList[0].id,
        });
      } else {
        this.noChatList();
      }
    } catch (e) {
      this.noChatList();
    }
  };

  noChatList = () => {
    const id = uuid();
    this.setState(
      {
        chatList: [{ id, title: "", textList: [] }],
        selectChat: id,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );
  };

  componentWillUnmount(): void {
    document.removeEventListener("keypress", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.code === "Enter" && !this.state.isLoading) {
      this.hh();
    }
  };

  hh = async () => {
    const { selectChat, chatList, inputValue } = this.state;
    if (!inputValue) return;
    let newTextList = [];
    const newChatList = chatList.reduce((acc, cur) => {
      if (cur.id === selectChat) {
        cur.title = cur.title || inputValue;
        newTextList = [
          ...cur.textList,
          { identity: EIdentity.USER, text: inputValue },
        ];
        cur.textList = newTextList;
      }
      acc.push(cur);
      return acc;
    }, []);

    this.setState(
      {
        inputValue: "",
        isLoading: true,
        chatList: newChatList,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );

    const data = await fetchChatGPT({
      data: getinput(newTextList),
      cancelToken: source.token,
    });

    const { choices = [], isError } = data;
    const { text: newText } = choices[0] || {};
    if (isError || !newText) {
      const newChatListAfter = this.state.chatList.reduce((acc, cur) => {
        if (cur.id === selectChat) {
          cur.title = cur.title || inputValue;
          newTextList = [
            ...cur.textList,
            {
              identity: EIdentity.GPT,
              text: "我出问题喽！！！",
              isError: true,
            },
          ];
          cur.textList = newTextList;
        }
        acc.push(cur);
        return acc;
      }, []);
      this.setState({
        chatList: newChatListAfter,
        isLoading: false,
      });
      return;
    }
    const newChatListAfter = this.state.chatList.reduce((acc, cur) => {
      if (cur.id === selectChat) {
        cur.title = cur.title || inputValue;
        newTextList = [
          ...cur.textList,
          { identity: EIdentity.GPT, text: newText },
        ];
        cur.textList = newTextList;
      }
      acc.push(cur);
      return acc;
    }, []);
    this.setState(
      {
        chatList: newChatListAfter,
        isLoading: false,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );
  };

  handleChangeItem = (id: string) => {
    if (this.state.isLoading) {
      source.cancel();
    }
    this.setState({ selectChat: id });
  };

  handleAddChat = () => {
    const id = uuid();
    const noContentList = !!this.state.chatList.filter((v) => !v.title).length;
    !noContentList &&
      this.setState({
        chatList: [{ id, title: "", textList: [] }, ...this.state.chatList],
        selectChat: id,
      });
  };

  handleDeleteChat = (id: string) => {
    const { chatList } = this.state;
    const newChatList = chatList.filter((v) => v.id !== id);
    if (newChatList.length) {
      this.setState(
        { selectChat: newChatList[0].id, chatList: newChatList },
        () => {
          localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
        }
      );
    } else {
      this.noChatList();
    }
  };

  render(): React.ReactNode {
    const { inputValue, isLoading, chatList, selectChat } = this.state;
    const { textList = [] } =
      chatList.filter((v) => v.id === selectChat)[0] || {};
    const textListT = isLoading
      ? [...textList, { identity: EIdentity.GPT, text: "", loading: true }]
      : textList;
    return (
      <div className="complex">
        <div className="complex-slide">
          <span className="complex-slide-title">chat</span>
          <div className="complex-slide-content">
            {chatList.map((v) => {
              const { title, id } = v;
              const activitied = id === selectChat;
              return (
                <div
                  key={id}
                  className={`tab-item ${
                    activitied ? "tab-item-activitied" : ""
                  }`}
                  onClick={() => this.handleChangeItem(id)}
                >
                  <span className="tab-item-text">{title || "未命名"}</span>

                  {activitied && chatList.length > 1 && (
                    <span
                      onClick={() => this.handleDeleteChat(id)}
                      className="tab-item-del"
                    >
                      <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="3665"
                        width="16"
                        height="16"
                      >
                        <path
                          d="M512 0C229.216 0 0 229.216 0 512s229.216 512 512 512 512-229.216 512-512S794.784 0 512 0zM709.184 663.936c16.064 16.064 18.976 39.232 6.464 51.712s-35.648 9.6-51.712-6.464L512 557.248l-151.936 151.936c-16.064 16.064-39.232 18.976-51.712 6.464s-9.6-35.648 6.464-51.712L466.752 512l-151.936-151.936c-16.064-16.064-18.976-39.232-6.464-51.712 12.512-12.512 35.648-9.6 51.712 6.464L512 466.752l151.936-151.936c16.064-16.064 39.232-18.976 51.712-6.464 12.512 12.512 9.6 35.648-6.464 51.712L557.248 512 709.184 663.936z"
                          fill="#2c2c2c"
                          p-id="3666"
                        ></path>
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="complex-slide-add">
            <span
              className="complex-slide-add-text"
              onClick={this.handleAddChat}
            >
              添加对话
            </span>
          </div>
        </div>
        <div className="complex-content">
          <div className="complex-content-output">
            <Output textList={textListT}></Output>
          </div>
          <div className="complex-content-input">
            <input
              className="complex-content-input-input"
              placeholder="输入"
              value={inputValue}
              onChange={(e) => {
                this.setState({ inputValue: e.target.value });
              }}
            ></input>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
