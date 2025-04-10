// App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./SlotMachine.css";
import { supabase } from "./supabaseClient";

function SlotMachine() {
  // 初始化項目列表
  const defaultItems = ["陳年紅茶半糖去冰","瑞順紅茶","胭脂紅茶","近美紅茶","春芽綠茶","雪花冷露","陳年寒露","春芽冷露"];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [newItem, setNewItem] = useState("");
  const [showItemManager, setShowItemManager] = useState(false);
  const slotItemsRef = useRef(null);

  // 從Supabase獲取項目
  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        
        // 從Supabase獲取項目
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        // 如果有數據，使用數據；否則使用默認項目並初始化數據庫
        if (data && data.length > 0) {
          setItems(data.map(item => item.name));
        } else {
          // 如果沒有數據，將默認項目添加到數據庫
          try {
            // 使用Promise.all正確地等待所有插入操作完成
            await Promise.all(
              defaultItems.map(item =>
                supabase.from('tasks').insert([{
                  name: item,
                  user: '00000000-0000-0000-0000-000000000000' // 提供一個默認的UUID值
                }])
              )
            );
            
            setItems(defaultItems);
          } catch (insertError) {
            console.error('Error initializing items:', insertError);
            setItems(defaultItems); // 即使出錯也使用默認項目
          }
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        setError(error.message);
        // 如果出錯，使用默認項目
        setItems(defaultItems);
      } finally {
        setLoading(false);
      }
    }
    
    fetchItems();
  }, []);

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

  // 刪除項目
  const deleteItem = async (index) => {
    try {
      const itemToDelete = items[index];
      
      // 從Supabase刪除項目
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('name', itemToDelete)
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', data[0].id);
        
        if (deleteError) {
          throw deleteError;
        }
      }
      
      // 更新本地狀態
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('刪除項目時出錯: ' + error.message);
    }
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
    <div className="slot-machine" style={{ position: 'relative' }}>
      <h1>瑩真の解憂店</h1>
      {loading ? (
        <p>載入中...</p>
      ) : error ? (
        <p>錯誤: {error}</p>
      ) : null}
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
              <button onClick={async () => {
                if (newItem.trim() !== "") {
                  try {
                    // 將新項目添加到Supabase
                    const { error } = await supabase
                      .from('tasks')
                      .insert([{
                        name: newItem,
                        user: '00000000-0000-0000-0000-000000000000' // 提供一個默認的UUID值
                      }]);
                    
                    if (error) {
                      throw error;
                    }
                    
                    // 更新本地狀態
                    setItems([...items, newItem]);
                    setNewItem("");
                  } catch (error) {
                    console.error('Error adding item:', error);
                    alert('新增項目時出錯: ' + error.message);
                  }
                }
              }}>新增</button>
            </div>
          </div>
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '20px',
        color: '#888',
        fontSize: '10px',
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        opacity: '0.7',
        letterSpacing: '1px'
      }}>
        by 大仙
      </div>
    </div>
  );
}

export default SlotMachine;
