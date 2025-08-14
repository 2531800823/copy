/**
 * 用户管理组件 - 演示如何使用用户相关接口
 */

import React, {useState, useEffect} from 'react';
import {api} from '../../services/api';
import styles from './UserManagement.module.less';

/** 用户数据类型 */
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** 分页响应类型 */
interface PaginationResponse {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 创建用户表单数据 */
interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

/** 编辑用户表单数据 */
interface EditUserForm {
  username: string;
  email: string;
  avatar?: string;
}

const UserManagement: React.FC = () => {
  /** 状态管理 */
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  /** 搜索条件 */
  const [searchParams, setSearchParams] = useState({
    username: '',
    email: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  /** 模态框状态 */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  /** 表单数据 */
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    avatar: '',
  });

  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    email: '',
    avatar: '',
  });

  /** 选中的用户ID列表 */
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  /**
   * 获取用户列表
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.user.getList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        username: searchParams.username || undefined,
        email: searchParams.email || undefined,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder,
      });

      if (response.success) {
        const data = response.data?.data as PaginationResponse;
        console.log('🚀 liu123 ~ data:', data);
        setUsers(data?.items??[]);
        setPagination((prev) => ({
          ...prev,
          total: data?.total??0,
          totalPages: data?.totalPages??0,
        }));
      } else {
        alert(`获取用户列表失败: ${response.message}`);
      }
    } catch (error) {
      alert(`获取用户列表出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建用户
   */
  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.password) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await api.user.create(createForm);
      if (response.success) {
        alert('用户创建成功');
        setShowCreateModal(false);
        setCreateForm({username: '', email: '', password: '', avatar: ''});
        fetchUsers(); // 刷新列表
      } else {
        alert(`创建用户失败: ${response.message}`);
      }
    } catch (error) {
      alert(`创建用户出错: ${error}`);
    }
  };

  /**
   * 编辑用户
   */
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
    });
    setShowEditModal(true);
  };

  /**
   * 更新用户
   */
  const handleUpdateUser = async () => {
    if (!editingUser || !editForm.username || !editForm.email) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await api.user.update(editingUser.id, editForm);
      if (response.success) {
        alert('用户信息更新成功');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers(); // 刷新列表
      } else {
        alert(`更新用户失败: ${response.message}`);
      }
    } catch (error) {
      alert(`更新用户出错: ${error}`);
    }
  };

  /**
   * 删除单个用户
   */
  const handleDeleteUser = async (id: string) => {
    if (!confirm('确定要删除这个用户吗？')) {
      return;
    }

    try {
      const response = await api.user.delete(id);
      if (response.success) {
        alert('用户删除成功');
        fetchUsers(); // 刷新列表
      } else {
        alert(`删除用户失败: ${response.message}`);
      }
    } catch (error) {
      alert(`删除用户出错: ${error}`);
    }
  };

  /**
   * 批量删除用户
   */
  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) {
      alert('请选择要删除的用户');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedUserIds.length} 个用户吗？`)) {
      return;
    }

    try {
      const response = await api.user.batchDelete(selectedUserIds);
      if (response.success) {
        alert('批量删除成功');
        setSelectedUserIds([]);
        fetchUsers(); // 刷新列表
      } else {
        alert(`批量删除失败: ${response.message}`);
      }
    } catch (error) {
      alert(`批量删除出错: ${error}`);
    }
  };

  /**
   * 处理分页变化
   */
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({...prev, page: newPage}));
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    setPagination((prev) => ({...prev, page: 1})); // 重置到第一页
    fetchUsers();
  };

  /**
   * 处理选择用户
   */
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  /**
   * 全选/取消全选
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map((user) => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  /** 组件挂载时获取数据 */
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.pageSize]);

  return (
    <div className={styles.container}>
      <h2>用户管理示例</h2>

      {/* 搜索和操作区域 */}
      <div className={styles.toolbar}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="搜索用户名"
            value={searchParams.username}
            onChange={(e) =>
              setSearchParams((prev) => ({...prev, username: e.target.value}))
            }
          />
          <input
            type="text"
            placeholder="搜索邮箱"
            value={searchParams.email}
            onChange={(e) =>
              setSearchParams((prev) => ({...prev, email: e.target.value}))
            }
          />
          <button onClick={handleSearch}>搜索</button>
        </div>

        <div className={styles.actionSection}>
          <button onClick={() => setShowCreateModal(true)}>创建用户</button>
          <button
            onClick={handleBatchDelete}
            disabled={selectedUserIds.length === 0}>
            批量删除 ({selectedUserIds.length})
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      users.length > 0 &&
                      selectedUserIds.length === users.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>头像</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(e) =>
                        handleSelectUser(user.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        className={styles.avatar}
                      />
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEditUser(user)}>编辑</button>
                    <button onClick={() => handleDeleteUser(user.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页组件 */}
      <div className={styles.pagination}>
        <button
          disabled={pagination.page <= 1}
          onClick={() => handlePageChange(pagination.page - 1)}>
          上一页
        </button>

        <span>
          第 {pagination.page} 页，共 {pagination.totalPages} 页， 总计{' '}
          {pagination.total} 条数据
        </span>

        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}>
          下一页
        </button>
      </div>

      {/* 创建用户模态框 */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>创建用户</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateUser();
              }}>
              <div className={styles.formGroup}>
                <label>用户名</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>邮箱</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({...prev, email: e.target.value}))
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>密码</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>头像URL</label>
                <input
                  type="text"
                  value={createForm.avatar}
                  onChange={(e) =>
                    setCreateForm((prev) => ({...prev, avatar: e.target.value}))
                  }
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit">创建</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {showEditModal && editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>编辑用户</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser();
              }}>
              <div className={styles.formGroup}>
                <label>用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((prev) => ({...prev, username: e.target.value}))
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({...prev, email: e.target.value}))
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>头像URL</label>
                <input
                  type="text"
                  value={editForm.avatar}
                  onChange={(e) =>
                    setEditForm((prev) => ({...prev, avatar: e.target.value}))
                  }
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit">更新</button>
                <button type="button" onClick={() => setShowEditModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
