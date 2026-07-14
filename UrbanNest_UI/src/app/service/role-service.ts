import { Injectable } from '@angular/core';
import { Role } from '../interface/role';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root',
})
export class RoleService {

  private apiUrl = `${environment.apiUrl}`;
  constructor(private http: HttpClient) { }

  getRole(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/Role/getAllRoles`);
  }

  addRole(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/Role/addRole`, role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Role/deleteRole/${id}`);
  }

  deleteRoleUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Role/deleteRoleUser?id=${id}`);
  }
}
