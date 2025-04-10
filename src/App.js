// App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./SlotMachine.css";
import { supabase } from "./supabaseClient";

// 獲取分類顏色
const getCategoryColor = (category) => {
  const colors = {
    'A': '#4CAF50', // 綠色
    'B': '#2196F3', // 藍色
    'C': '#9C27B0', // 紫色
    'D': '#FF9800', // 橙色
    'E': '#F44336', // 紅色
    'F': '#607D8B'  // 藍灰色
  };
  return colors[category] || '#888888'; // 默認灰色
};

function SlotMachine() {
  // 初始化項目列表和分類
  const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
  const defaultItems = [
    { name: "陳年紅茶半糖去冰", category: "A" },
    { name: "瑞順紅茶", category: "A" },
    { name: "胭脂紅茶", category: "B" },
    { name: "近美紅茶", category: "B" },
    { name: "春芽綠茶", category: "C" },
    { name: "雪花冷露", category: "D" },
    { name: "陳年寒露", category: "E" },
    { name: "春芽冷露", category: "F" }
  ];
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [newItem, setNewItem] = useState("");
  const [showItemManager, setShowItemManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
          setItems(data);
        } else {
          // 如果沒有數據，將默認項目添加到數據庫
          try {
            // 使用Promise.all正確地等待所有插入操作完成
            await Promise.all(
              defaultItems.map(item =>
                supabase.from('tasks').insert([{
                  name: item.name,
                  category: item.category
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
        setResult(`結果: ${winningItem.name}`);
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', itemToDelete.id);
      
      if (error) {
        throw error;
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
            {item.name}
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
            margin: '10% auto',
            padding: '20px',
            border: '1px solid #888',
            width: '80%',
            maxWidth: '800px',
            color: 'black'
          }}>
            <span className="close" onClick={() => {
              setShowItemManager(false);
              setSelectedCategory(null);
            }} style={{
              color: '#aaa',
              float: 'right',
              fontSize: '28px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>&times;</span>
            
            <h2>拉霸機管理</h2>
            
            {/* 顯示當前拉霸機上的所有項目 */}
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ marginTop: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>當前拉霸機項目</span>
                <span style={{
                  fontSize: '14px',
                  backgroundColor: items.length >= 8 && items.length <= 12 ? '#4CAF50' : '#ff9800',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  總數: {items.length} {items.length < 8 ? '(建議增加)' : items.length > 12 ? '(建議減少)' : '(理想範圍)'}
                </span>
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '5px'
              }}>
                {items.map((item, index) => (
                  <div key={index} style={{
                    backgroundColor: getCategoryColor(item.category),
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {item.name}
                    <span style={{ fontSize: '10px', opacity: '0.8' }}>({item.category})</span>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedCategory === null ? (
              // 顯示分類選擇界面
              <>
                <h3>選擇分類進行管理</h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  marginTop: '20px'
                }}>
                  {categories.map((category) => {
                    const categoryItems = items.filter(item => item.category === category);
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                          padding: '15px 25px',
                          fontSize: '16px',
                          backgroundColor: getCategoryColor(category),
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: '120px'
                        }}
                      >
                        <strong>{category}分類</strong>
                        <span style={{ fontSize: '12px', marginTop: '5px' }}>
                          {categoryItems.length}個項目
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              // 顯示特定分類的項目管理界面
              <>
                <h3 style={{
                  backgroundColor: getCategoryColor(selectedCategory),
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px'
                }}>
                  {selectedCategory}分類 - 管理項目
                </h3>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    marginBottom: '15px',
                    padding: '5px 10px',
                    backgroundColor: '#f1f1f1',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  返回分類選擇
                </button>
                
                <ul style={{
                  listStyleType: 'none',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '5px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginBottom: '15px'
                }}>
                  {items
                    .filter(item => item.category === selectedCategory)
                    .map((item, index) => (
                      <li key={index} style={{
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        marginBottom: '5px',
                        borderRadius: '3px'
                      }}>
                        {item.name}
                        <button
                          onClick={() => deleteItem(items.findIndex(i => i.id === item.id))}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          刪除
                        </button>
                      </li>
                    ))}
                </ul>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    style={{
                      padding: '8px',
                      flex: '1',
                      border: '1px solid #ddd',
                      borderRadius: '3px'
                    }}
                    placeholder={`新增項目到${selectedCategory}分類`}
                  />
                  <button
                    onClick={async () => {
                      if (newItem.trim() !== "") {
                        try {
                          // 將新項目添加到Supabase
                          const { data, error } = await supabase
                            .from('tasks')
                            .insert([{
                              name: newItem,
                              category: selectedCategory
                            }])
                            .select();
                          
                          if (error) {
                            throw error;
                          }
                          
                          // 更新本地狀態
                          setItems([...items, data[0]]);
                          setNewItem("");
                        } catch (error) {
                          console.error('Error adding item:', error);
                          alert('新增項目時出錯: ' + error.message);
                        }
                      }
                    }}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: getCategoryColor(selectedCategory),
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    新增
                  </button>
                </div>
              </>
            )}
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
