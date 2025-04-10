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
  
  const [coreItems, setCoreItems] = useState([]); // Renamed from items - Represents the full library from Supabase
  const [slotMachineItems, setSlotMachineItems] = useState([]); // Items currently on the slot machine wheel
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [newItem, setNewItem] = useState("");
  const [showItemManager, setShowItemManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const slotItemsRef = useRef(null);

  // 從Supabase獲取核心項目庫 (Core Items)
  useEffect(() => {
    async function fetchCoreItems() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        let fetchedItems = [];
        if (data && data.length > 0) {
          fetchedItems = data;
        } else {
          // Initialize database with default items if empty
          console.log("No items found in DB, initializing with defaults...");
          const { data: insertedData, error: insertError } = await supabase
            .from('tasks')
            .insert(defaultItems.map(item => ({ name: item.name, category: item.category })))
            .select(); // Select the inserted data to get IDs

          if (insertError) {
             console.error('Error initializing items:', insertError);
             fetchedItems = defaultItems.map((item, index) => ({ ...item, id: `default-${index}` })); // Use temporary IDs if insert fails
          } else {
             fetchedItems = insertedData || defaultItems.map((item, index) => ({ ...item, id: `default-${index}` })); // Use inserted data or defaults
             console.log("Default items initialized in DB:", fetchedItems);
          }
        }
        setCoreItems(fetchedItems);

      } catch (error) {
        console.error('Error fetching core items:', error);
        setError(error.message);
        // Fallback to default items if fetch fails
        setCoreItems(defaultItems.map((item, index) => ({ ...item, id: `default-${index}` })));
      } finally {
        setLoading(false);
      }
    }
    fetchCoreItems();
  }, []); // Empty dependency array ensures this runs only once on mount

  // 加載/初始化拉霸機項目 (Slot Machine Items) from Local Storage
   useEffect(() => {
    if (loading) return; // Wait for coreItems to load

    const savedSlotItems = localStorage.getItem('slotMachineItems');
    if (savedSlotItems) {
      try {
        const parsedItems = JSON.parse(savedSlotItems);
        // Basic validation: check if it's an array
        if (Array.isArray(parsedItems)) {
           // Further validation: Ensure items exist in coreItems (optional but good practice)
           const validItems = parsedItems.filter(slotItem =>
             coreItems.some(coreItem => coreItem.id === slotItem.id)
           );
           setSlotMachineItems(validItems);
           console.log("Loaded slot machine items from localStorage:", validItems);
           // Update local storage with potentially filtered items
           if (validItems.length !== parsedItems.length) {
             localStorage.setItem('slotMachineItems', JSON.stringify(validItems));
           }
        } else {
           console.warn("Invalid data found in localStorage for slotMachineItems, expected an array.");
           // Initialize with coreItems if localStorage data is invalid
           setSlotMachineItems([...coreItems]);
           localStorage.setItem('slotMachineItems', JSON.stringify(coreItems));
           console.log("Initialized slot machine items with core items (invalid localStorage).");
        }
      } catch (e) {
        console.error("Failed to parse slotMachineItems from localStorage:", e);
        // Initialize with coreItems if parsing fails
        setSlotMachineItems([...coreItems]);
        localStorage.setItem('slotMachineItems', JSON.stringify(coreItems));
        console.log("Initialized slot machine items with core items (localStorage parse error).");
      }
    } else if (coreItems.length > 0) {
      // Initialize with coreItems if nothing in localStorage and coreItems are loaded
      setSlotMachineItems([...coreItems]);
      localStorage.setItem('slotMachineItems', JSON.stringify(coreItems));
      console.log("Initialized slot machine items with core items (no localStorage).");
    }
   }, [coreItems, loading]); // Run when coreItems are loaded or loading state changes

   // 保存拉霸機項目 (Slot Machine Items) to Local Storage whenever it changes
   useEffect(() => {
     // Avoid saving during initial load or if slotMachineItems hasn't been initialized yet
     if (!loading && slotMachineItems.length > 0) {
        try {
           localStorage.setItem('slotMachineItems', JSON.stringify(slotMachineItems));
           console.log("Saved slot machine items to localStorage:", slotMachineItems);
        } catch (e) {
           console.error("Failed to save slotMachineItems to localStorage:", e);
        }
     }
   }, [slotMachineItems, loading]);

  // 拉霸機轉動
  const spin = () => {
    if (spinning || slotMachineItems.length === 0) return; // Don't spin if empty

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
        Math.floor(Math.random() * slotMachineItems.length) + slotMachineItems.length * 2;
      const stopPosition = -(randomIndex * itemHeight);

      // 設置轉動動畫
      slotItemsRef.current.style.transition =
        "top 3s cubic-bezier(0.21, 0.53, 0.29, 0.99)";
      slotItemsRef.current.style.top = stopPosition + "px";

      // 顯示結果
      setTimeout(() => {
        const winningIndex = randomIndex % slotMachineItems.length;
        const winningItem = slotMachineItems[winningIndex];
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
      const itemToDelete = coreItems[index]; // Should delete from coreItems
      
      // 從Supabase刪除項目
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', itemToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // 更新核心項目庫狀態
      const newCoreItems = coreItems.filter(item => item.id !== itemToDelete.id);
      setCoreItems(newCoreItems);

      // 同步更新拉霸機項目狀態 (移除所有同ID的項目)
      const newSlotItems = slotMachineItems.filter(item => item.id !== itemToDelete.id);
      setSlotMachineItems(newSlotItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('刪除項目時出錯: ' + error.message);
    }
  };

  const renderSlotItems = () => {
    // 為了讓動畫效果更好，我們重複3次項目列表
    const allItems = [];
    for (let i = 0; i < 3; i++) {
      // Use slotMachineItems for rendering the wheel
      slotMachineItems.forEach((item, index) => {
         // Use a more unique key if items can be duplicated and have the same name/category
         // Using index within the loop combined with item id should be reasonably unique
         const key = `${i}-${item.id}-${index}`;
         allItems.push(
           <div key={key} className="slot-item">
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
            
            {/* 新增一個說明區塊 */}
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '10px 15px',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #b0e0e6',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>使用說明：</strong></p>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>「核心項目庫」包含所有可用的飲料選項</li>
                <li>「當前拉霸機項目」是實際出現在拉霸機上的選項</li>
                <li>使用「加入拉霸」按鈕將項目加入拉霸機（可重複加入同一項目來增加其出現機率）</li>
                <li>點擊拉霸機項目上的「×」按鈕可將其從拉霸機中移除（但仍保留在核心項目庫中）</li>
                <li>「永久刪除」按鈕會將項目從核心項目庫和拉霸機中永久移除</li>
              </ul>
            </div>
            
            {/* 顯示當前拉霸機上的所有項目 */}
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #ddd',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginTop: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>當前拉霸機項目（實際參與抽獎的選項）</span>
                {/* Display count for slotMachineItems */}
                <span style={{
                  fontSize: '14px',
                  backgroundColor: slotMachineItems.length >= 8 && slotMachineItems.length <= 12 ? '#4CAF50' : '#ff9800',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  總數: {slotMachineItems.length} {slotMachineItems.length < 8 ? '(建議增加)' : slotMachineItems.length > 12 ? '(建議減少)' : '(理想範圍)'}
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
                {/* Display slotMachineItems */}
                {slotMachineItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} style={{
                    backgroundColor: getCategoryColor(item.category),
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    position: 'relative'
                  }}>
                    <span style={{ marginRight: '20px' }}>{item.name}</span>
                    <span style={{ fontSize: '10px', opacity: '0.8' }}>({item.category})</span>
                    <button
                      onClick={() => {
                        // 從拉霸機移除項目，但保留在核心項目庫中
                        const newSlotItems = [...slotMachineItems];
                        newSlotItems.splice(index, 1);
                        setSlotMachineItems(newSlotItems);
                      }}
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '-8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        color: '#333',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 新增一個分隔線 */}
            <div style={{
              height: '1px',
              backgroundColor: '#ddd',
              margin: '20px 0',
              width: '100%'
            }}></div>
            
            <h3 style={{ marginBottom: '15px' }}>核心項目庫（所有可用選項）</h3>
            
            {selectedCategory === null ? (
              // 顯示分類選擇界面
              <>
                <h4>選擇分類進行管理</h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  marginTop: '20px'
                }}>
                  {categories.map((category) => {
                    const categoryItems = coreItems.filter(item => item.category === category); // Filter coreItems for category view
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
                <h4 style={{
                  backgroundColor: getCategoryColor(selectedCategory),
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px'
                }}>
                  {selectedCategory}分類 - 核心項目庫管理
                </h4>
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
                  {/* This list should now show CORE items for the selected category */}
                  {coreItems
                    .filter(item => item.category === selectedCategory)
                    .map((item) => ( // Use item.id for key
                      <li key={item.id} style={{
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        marginBottom: '5px',
                        borderRadius: '3px'
                      }}>
                        <span>{item.name}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                           {/* Add to Slot button */}
                           <button
                             onClick={() => {
                               // 將項目加入拉霸機
                               setSlotMachineItems([...slotMachineItems, item]);
                             }}
                             style={{
                               backgroundColor: '#4CAF50',
                               color: 'white',
                               border: 'none',
                               padding: '5px 10px',
                               borderRadius: '3px',
                               cursor: 'pointer'
                             }}
                           >
                             加入拉霸
                           </button>
                           
                           {/* Delete button */}
                           <button
                             onClick={() => {
                               // Find the index in the original coreItems array before filtering
                               const coreIndex = coreItems.findIndex(i => i.id === item.id);
                               if (coreIndex !== -1) {
                                 deleteItem(coreIndex); // This now deletes from coreItems and slotMachineItems
                               }
                             }}
                             style={{
                               backgroundColor: '#f44336',
                               color: 'white',
                               border: 'none',
                               padding: '5px 10px',
                               borderRadius: '3px',
                               cursor: 'pointer'
                             }}
                           >
                             永久刪除
                           </button>
                        </div>
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
                          
                          // 更新核心項目庫狀態
                          setCoreItems([...coreItems, data[0]]);
                          // Optionally, add the new item directly to the slot machine? Ask user? For now, just add to core.
                          // setSlotMachineItems([...slotMachineItems, data[0]]);
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
