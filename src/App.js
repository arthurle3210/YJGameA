// App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./SlotMachine.css";

function SlotMachine() {
  // 從 localStorage 讀取項目
  const storedItems = localStorage.getItem('slotMachineItems');
  const initialItems = storedItems ? JSON.parse(storedItems) : ["陳年紅茶半糖去冰","瑞順紅茶","胭脂紅茶","近美紅茶","春芽綠茶","雪花冷露","陳年寒露","春芽冷露"];
  const [items, setItems] = useState(initialItems);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [newItem, setNewItem] = useState("");
  const [showItemManager, setShowItemManager] = useState(false);
  const slotItemsRef = useRef(null);

  // 使用 useEffect 監聽項目變更，並儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('slotMachineItems', JSON.stringify(items));
  }, [items]);

  // 拉霸機轉動
  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    // 重置位置
    if (slotItemsRef.current) {
      slotItemsRef.current.style.transition = "none";
      slotItemsRef.current.style.top = "0px";

      // 強制重繪
      slotItemsRef.current.offsetHeight;

      // 隨機決定停止的位置
      const itemHeight = 100; // 每個項目的高度

      // 隨機選擇一個項目位置 (確保至少旋轉兩輪)
      const randomIndex =
        Math.floor(Math.random() * items.length) + items.length * 2;
      const stopPosition = -(randomIndex * itemHeight);

      // 設置轉動動畫
      slotItemsRef.current.style.transition =
        "top 3s cubic-bezier(0.21, 0.53, 0.29, 0.99)";
      slotItemsRef.current.style.top = stopPosition + "px";

      // 顯示結果
      setTimeout(() => {
        const winningItem = items[randomIndex % items.length];
        setResult(`結果: ${winningItem}`);
        setSpinning(false);
      }, 3000);
    }
  };

  const addItem = () => {
    setShowItemManager(true);
  };

  const deleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const renderSlotItems = () => {
    // 為了讓動畫效果更好，我們重複3次項目列表
    const allItems = [];
    for (let i = 0; i < 3; i++) {
      items.forEach((item, index) => {
        allItems.push(
          <div key={`${i}-${index}`} className="slot-item">
            {item}
          </div>
        );
      });
    }
    return allItems;
  };

  return (
    <div className="slot-machine">
      <h1>拉霸機遊戲</h1>
      <div className="slot-window">
        <div className="slot-items" ref={slotItemsRef}>
          {renderSlotItems()}
        </div>
      </div>
      <button onClick={spin} disabled={spinning} className="spin-button">
        拉霸!
      </button>
      <div className="result">{result}</div>
      <button onClick={addItem}>管理項目</button>

      {showItemManager && (
        <div className="modal" style={{
          display: showItemManager ? 'block' : 'none',
          position: 'fixed',
          zIndex: '1',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          overflow: 'auto',
          backgroundColor: 'rgba(0,0,0,0.4)'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#fefefe',
            margin: '15% auto',
            padding: '20px',
            border: '1px solid #888',
            width: '80%',
            color: 'black'
          }}>
            <span className="close" onClick={() => setShowItemManager(false)} style={{
              color: '#aaa',
              float: 'right',
              fontSize: '28px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>&times;</span>
            <h2>管理項目</h2>
            <ul>
              {items.map((item, index) => (
                <li key={index}>
                  {item}
                  <button onClick={() => deleteItem(index)}>刪除</button>
                </li>
              ))}
            </ul>
            <div>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <button onClick={() => {
                if (newItem.trim() !== "") {
                  setItems([...items, newItem]);
                  setNewItem("");
                }
              }}>新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlotMachine;
